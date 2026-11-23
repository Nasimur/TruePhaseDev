"""Baseline random forest for next-cycle-length prediction.

Trains on the Marquette FedCycleData (Kaggle: nikitabisht/menstrual-cycle-data),
which must be placed in research/data/raw/ and is never committed.

Task: for each cycle after a person's first, predict LengthofCycle using only
information available when that cycle starts: the person's earlier cycles and
their profile (age, BMI, ...). Same-cycle fields such as ovulation day or luteal
phase length are excluded because they are only known after the cycle ends.

Evaluation holds out 20% of people (GroupShuffleSplit on ClientID, seeded), so
the model trains on 80% and every score is measured on people it never saw. The forest is compared against simple
baselines (last cycle, mean / median of history, constant 28).

Run from research/:
    .venv/bin/python models/random_forest_baseline.py
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.inspection import permutation_importance
from sklearn.metrics import mean_absolute_error
from sklearn.model_selection import GroupShuffleSplit

RESEARCH_DIR = Path(__file__).resolve().parents[1]
RAW_DIR = RESEARCH_DIR / "data" / "raw"
RESULTS_DIR = RESEARCH_DIR / "results"
SEED = 42

# Profile fields are only filled on each person's first row; they are carried
# forward to the rest of that person's cycles.
PROFILE_COLUMNS = {
    "Age": "age",
    "BMI": "bmi",
    "Numberpreg": "pregnancies",
    "Livingkids": "living_kids",
    "Breastfeeding": "breastfeeding",
}

# Per-cycle columns used only through earlier cycles (shifted by one).
PRIOR_CYCLE_COLUMNS = {
    "LengthofMenses": "prev_menses_length",
    "TotalMensesScore": "prev_menses_score",
    "UnusualBleeding": "prev_unusual_bleeding",
}


def find_dataset(raw_dir: Path) -> Path:
    candidates = sorted(raw_dir.glob("FedCycleData*.csv")) or sorted(
        raw_dir.glob("*.csv")
    )
    if not candidates:
        raise SystemExit(f"No CSV found in {raw_dir}. Download the Kaggle data there.")
    return candidates[0]


def load_cycles(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path, dtype=str, encoding="utf-8-sig")
    df = df.apply(lambda col: col.str.strip()).replace("", np.nan)

    numeric = ["CycleNumber", "LengthofCycle", "ReproductiveCategory"]
    numeric += list(PROFILE_COLUMNS) + list(PRIOR_CYCLE_COLUMNS)
    for column in numeric:
        df[column] = pd.to_numeric(df[column], errors="coerce")

    df = df.dropna(subset=["ClientID", "CycleNumber", "LengthofCycle"])
    df = df.sort_values(["ClientID", "CycleNumber"]).reset_index(drop=True)
    df[list(PROFILE_COLUMNS)] = df.groupby("ClientID")[list(PROFILE_COLUMNS)].ffill()
    return df


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """One row per cycle with at least one earlier cycle for the same person."""
    by_client = df.groupby("ClientID", group_keys=False)
    lengths = by_client["LengthofCycle"]

    out = pd.DataFrame(
        {
            "client_id": df["ClientID"],
            "target_length": df["LengthofCycle"],
            "n_prior_cycles": by_client.cumcount(),
            "prev_length_1": lengths.shift(1),
            "prev_length_2": lengths.shift(2),
            "prev_length_3": lengths.shift(3),
            "history_mean": lengths.transform(lambda s: s.shift(1).expanding().mean()),
            "history_median": lengths.transform(
                lambda s: s.shift(1).expanding().median()
            ),
            "history_std": lengths.transform(lambda s: s.shift(1).expanding().std()),
            "reproductive_category": df["ReproductiveCategory"],
        }
    )
    for source, name in PRIOR_CYCLE_COLUMNS.items():
        out[name] = by_client[source].shift(1)
    for source, name in PROFILE_COLUMNS.items():
        out[name] = df[source]

    return out[out["n_prior_cycles"] >= 1].reset_index(drop=True)


FEATURES = [
    "n_prior_cycles",
    "prev_length_1",
    "prev_length_2",
    "prev_length_3",
    "history_mean",
    "history_median",
    "history_std",
    "reproductive_category",
    *PRIOR_CYCLE_COLUMNS.values(),
    *PROFILE_COLUMNS.values(),
]


def evaluate(data: pd.DataFrame, test_size: float) -> dict:
    X = data[FEATURES]
    y = data["target_length"].to_numpy()
    groups = data["client_id"].to_numpy()

    # Split by person so no one appears in both training and testing.
    splitter = GroupShuffleSplit(n_splits=1, test_size=test_size, random_state=SEED)
    train, test = next(splitter.split(X, y, groups))

    model = RandomForestRegressor(
        n_estimators=300,
        min_samples_leaf=5,
        random_state=SEED,
        n_jobs=-1,
    )
    model.fit(X.iloc[train], y[train])

    y_test = y[test]
    test_rows = data.iloc[test]
    predictions = {
        "constant_28": np.full(len(test), 28.0),
        "last_cycle": test_rows["prev_length_1"].to_numpy(),
        "history_mean": test_rows["history_mean"].to_numpy(),
        "history_median": test_rows["history_median"].to_numpy(),
        "random_forest": model.predict(X.iloc[test]),
    }

    result = permutation_importance(
        model,
        X.iloc[test],
        y_test,
        scoring="neg_mean_absolute_error",
        n_repeats=10,
        random_state=SEED,
        n_jobs=-1,
    )

    scores = {
        name: round(float(mean_absolute_error(y_test, pred)), 3)
        for name, pred in predictions.items()
    }
    ranking = sorted(
        zip(FEATURES, result.importances_mean), key=lambda item: item[1], reverse=True
    )
    return {
        "test_size": test_size,
        "train_rows": int(len(train)),
        "test_rows": int(len(test)),
        "train_people": int(pd.Series(groups[train]).nunique()),
        "test_people": int(pd.Series(groups[test]).nunique()),
        "mae_days": scores,
        "permutation_importance_mae_days": {
            name: round(float(value), 4) for name, value in ranking
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--data", type=Path, help="Path to the FedCycleData CSV")
    parser.add_argument(
        "--test-size", type=float, default=0.2, help="Share of people held out"
    )
    args = parser.parse_args()

    path = args.data or find_dataset(RAW_DIR)
    data = build_features(load_cycles(path))
    report = evaluate(data, args.test_size)

    print(f"Train: {report['train_rows']} cycles from {report['train_people']} people")
    print(f"Test:  {report['test_rows']} cycles from {report['test_people']} people "
          f"({report['test_size']:.0%} of people held out)\n")
    print("Mean absolute error on the test set (days), lower is better:")
    for name, mae in sorted(report["mae_days"].items(), key=lambda item: item[1]):
        print(f"  {name:16} {mae:6.3f}")
    print("\nPermutation importance (MAE increase in days when shuffled):")
    for name, value in report["permutation_importance_mae_days"].items():
        print(f"  {name:22} {value:7.4f}")

    RESULTS_DIR.mkdir(exist_ok=True)
    out_path = RESULTS_DIR / "random_forest_baseline.json"
    out_path.write_text(json.dumps(report, indent=2) + "\n")
    print(f"\nSaved {out_path.relative_to(RESEARCH_DIR)}")


if __name__ == "__main__":
    main()
