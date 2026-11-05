import {
  ArrowLeft,
  CalendarDays,
  ChartNoAxesCombined,
  Settings2,
} from "lucide-react";
import { Link } from "react-router-dom";

const content = {
  calendar: {
    title: "Your calendar is on its way",
    description: "Soon you’ll be able to add and review period dates here.",
    icon: CalendarDays,
  },
  insights: {
    title: "Insights are on their way",
    description:
      "Your patterns will appear here once tracking and insights are ready.",
    icon: ChartNoAxesCombined,
  },
  settings: {
    title: "Settings are on their way",
    description: "Your preferences will live here as TruePhase grows.",
    icon: Settings2,
  },
} as const;

export function ComingSoonPage({ kind }: { kind: keyof typeof content }) {
  const { title, description, icon: Icon } = content[kind];
  return (
    <div className="page placeholder-page">
      <p className="eyebrow">COMING SOON</p>
      <div className="placeholder-card">
        <span className="placeholder-icon">
          <Icon size={36} strokeWidth={1.5} aria-hidden="true" />
        </span>
        <h1>{title}</h1>
        <p>{description}</p>
        <Link to="/" className="text-link">
          <ArrowLeft size={17} aria-hidden="true" /> Back to overview
        </Link>
      </div>
    </div>
  );
}
