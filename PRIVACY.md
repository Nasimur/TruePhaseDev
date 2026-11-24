# Privacy

**Short version:** TruePhase stores your cycle records only in the browser you use it in. We don't run a server that receives your health data, there is no account, and we don't track you.

This page describes the app as it is during alpha development. We will review it before any public release and update it whenever the app's behaviour changes.

## What TruePhase stores

| Data | Where | Status |
| --- | --- | --- |
| Period start and end dates | Your browser's IndexedDB on this device | Available |
| Daily logs: pain level (0–10), moods, energy, flow, notes up to 500 characters | Your browser's IndexedDB on this device | Planned |
| App files (HTML, JavaScript, CSS, icons), so the app can open offline | Your browser's cache, through a service worker | In review |

TruePhase does **not** ask for your name, email, age, weight, pregnancy history or location. We don't add personal profile questions just because a prediction model could use them.

## What leaves your device

- **Your health data:** nothing. Period records, and daily logs once they're added, are never uploaded by TruePhase. Predictions will be calculated in your browser.
- **App files:** your browser downloads them from wherever the app is hosted, like any website. The host can see ordinary web-server information such as your IP address and when you loaded the page. It cannot see your records.
- **Fonts:** the current `main` build loads web fonts from Google Fonts, so Google can see that request. This is being removed so the app makes no third-party requests ([PR #17](https://github.com/Nasimur/TruePhaseDev/pull/17)).
- **No analytics, advertising, tracking pixels or telemetry.**

## Important limits

**Your data is not encrypted by TruePhase, and it is not backed up.**

- **It's tied to one browser on one device.** Records in Chrome on your phone don't appear in Safari or on your laptop.
- **Clearing data deletes it permanently.** Clearing your browser's site data, cookies or history for TruePhase deletes your records, and there is no way for us to recover them.
- **The browser can delete it.** A browser may remove stored data when the device is low on space, or after long periods without use, especially on iOS. Installing TruePhase to your home screen lowers this risk on some browsers, but doesn't remove it.
- **Private windows don't keep it.** In a private or incognito window, records are deleted when you close it.
- **Anyone who can use your device or browser profile can open the app and see your records.** On a shared device, consider using a separate browser profile.
- **Your device's backups may include it.** If your device or browser backs up site data, TruePhase records may be included, under that provider's own policy.

## Your control

- **To delete everything:** clear site data for TruePhase in your browser settings. This removes all stored records and cached app files.
- **To delete one period:** select it on the calendar and choose **Remove period**.

## Before public release

The following will be in place before TruePhase is released publicly:

- **Export:** download a copy of your records in an open format, so you can keep your own backup.
- **Import:** restore records from an export file, with validation and no silent overwrites.
- **Delete all data:** an in-app button that clearly states it can't be undone.
- **Clear warnings** in the app about the storage limits above.
- **A review of this page** against the final release build, including its hosting and any dependencies.

## Not medical advice

Cycle predictions, once added, are estimates based on your past records. They are not suitable for contraception, planning or avoiding pregnancy, or diagnosing any condition. Talk to a healthcare professional about health concerns.

## Questions

Open an issue on [GitHub](https://github.com/Nasimur/TruePhaseDev/issues). Please don't include any personal health information in the issue.
