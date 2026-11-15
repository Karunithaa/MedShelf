# MedShelf — Offline Home Medicine Cabinet Organizer

**MedShelf** is an offline-first mobile application developed with **React Native and Expo** to help individuals and families organize medicines stored at home. Users can maintain a personal medicine inventory, view expiry and low-stock information, record medicine usage, and set optional reminders — without relying on an online database or public API.

> **Academic project:** ICA 03 – Individual React Native Project  
> **Project type:** Mobile application (Android / iOS)

## Features

- **Offline registration and login:** Create local accounts, sign in, and log out. Passwords are stored as salted PBKDF2-SHA256 hashes, not as plain text.
- **Separate inventories:** Each local account manages its own medicines; each new account starts with an empty inventory, except for the designated demo account.
- **Dashboard:** View totals for medicines, expired medicines, soon-to-expire medicines, and low-stock medicines. See the next three scheduled medicine times.
- **Medicine management:** Add, view, edit, and delete medicine entries; record category, form, strength label, quantity, unit, expiry date, storage location, low-stock threshold, and notes.
- **Optional images:** Attach a locally stored photo of a medicine.
- **Search, filter, and sort:** Search by name, filter by category or expiry status, and sort by name or expiry date.
- **Stock tracking:** Mark a medicine as used to reduce its quantity, or add stock when replenishing it.
- **Family profiles:** Create and switch between family members, each with a separate medicine inventory under the same account.
- **Optional medicine schedules:** Record multiple times per day, the quantity per scheduled time, and meal-related timing information.
- **Local notifications:** Request device notification permission and schedule medicine reminders and expiry alerts; show low-stock notifications when applicable. Notification delivery depends on device permissions and platform support.
- **Personalized settings:** Select an expiry warning period and a default low-stock threshold.

> **Disclaimer:** MedShelf is for inventory organization only. It does not provide medical advice, diagnoses, prescriptions, or dosage recommendations. Always follow guidance from a qualified healthcare professional or the medicine label.

## Application screens

The project contains **nine screen components**:

| Screen | Purpose |
| --- | --- |
| Login | Sign in to an existing local account |
| Register | Create a new offline account |
| Dashboard | View inventory statistics and upcoming scheduled medicines |
| Inventory | Search, filter, sort, and browse medicines |
| Medicine Details | View details, mark as used, add stock, edit, or delete |
| Add/Edit Medicine | Create or update a medicine and optionally attach an image |
| Alerts | View medicine expiry and stock alerts |
| Family Profiles | Add, select, or remove family members |
| Settings | Change inventory preferences, refresh notifications, and log out |

Navigation uses **React Navigation**, with bottom tabs for **Dashboard**, **Inventory**, and **Alerts**, and stack navigation for other screens.

## Technology stack

| Technology | Usage |
| --- | --- |
| React Native 0.88.1 | Mobile application UI |
| Expo SDK 58 | Development tooling and native Expo modules |
| React Navigation | Stack and bottom-tab navigation |
| Expo SQLite | Local relational database and persistent inventory |
| Expo SecureStore | Local signed-in session storage |
| Expo Notifications | On-device medicine and expiry reminders |
| Expo Image Picker / File System | Optional medicine photos and local file storage |
| Expo Crypto + `@noble/hashes` | Salted password hashing |
| JavaScript / JSX | Application code |

No backend server, public API, or cloud database is required for the app's core functionality.

## Project structure

```text
MedShelf/
├── App.js
├── index.js
├── app.json
├── package.json
├── package-lock.json
├── .gitignore
├── LICENSE
└── src/
    ├── components/
    │   ├── QuantityDialog.jsx
    │   └── UI.jsx
    ├── context/
    │   └── AuthContext.jsx
    ├── data/
    │   └── sampleMedicines.js
    ├── database/
    │   └── db.js
    ├── navigation/
    │   └── RootNavigator.jsx
    ├── screens/
    │   ├── AddEditMedicineScreen.jsx
    │   ├── AlertsScreen.jsx
    │   ├── DashboardScreen.jsx
    │   ├── FamilyProfilesScreen.jsx
    │   ├── InventoryScreen.jsx
    │   ├── LoginScreen.jsx
    │   ├── MedicineDetailsScreen.jsx
    │   ├── RegisterScreen.jsx
    │   └── SettingsScreen.jsx
    ├── theme/
    │   └── colors.js
    └── utils/
        ├── medicine.js
        ├── medicineImages.js
        ├── notifications.js
        └── password.js
```

## Installation and running the project

### Prerequisites

- **Node.js** and **npm** installed on your computer.
- **Git** (if cloning the repository).
- **Expo Go** on a compatible iPhone or Android device, or another supported Expo development environment.

### 1. Clone or download

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
cd YOUR_REPOSITORY
```

Replace `YOUR_USERNAME` and `YOUR_REPOSITORY` with the actual GitHub account and repository name. Alternatively, select **Code → Download ZIP** on GitHub, extract it, and open the folder containing `package.json` in a terminal.

### 2. Install dependencies

```bash
npm ci
```

This uses the included `package-lock.json`. If you modify dependencies, use `npm install` and commit the updated lockfile.

### 3. Check dependencies

```bash
npx expo-doctor
```

Resolve any reported dependency or environment issues before continuing.

### 4. Start Expo

```bash
npx expo start --clear
```

Scan the displayed QR code with Expo Go (on iPhone, scan using the Camera app). Keep the phone and computer on a compatible network. If the local network connection is blocked, try:

```bash
npx expo start --tunnel --clear
```

The tunnel method may require additional setup and internet access **during development**; it does not change the app's offline data-storage design.

Additional scripts defined in `package.json`:

```bash
npm start           # Start Expo
npm run android     # Launch using an available Android environment
npm run ios         # Launch using an available iOS environment
npm run check       # Run expo-doctor
```

**Note:** Native modules, especially notifications and secure storage, may behave differently on web or simulator environments. Test the intended mobile experience on a physical device. A successful installation and launch have not been independently verified on every platform.

## Accounts and demo dataset

### New user account

1. Open the application and select **Register**.
2. Enter a username (3–30 characters) and password (at least 8 characters).
3. Complete registration and then sign in.
4. The medicine inventory starts **empty**, ready for personal entries.

All accounts and data are stored locally on the installation's device, not synchronized between devices.

### Dedicated ICA demonstration account

The code includes **28 fictional sample medicine records** in `src/data/sampleMedicines.js`.

To generate the demo inventory on a fresh installation:

1. Open **Register**.
2. Enter the username **`medshelf_demo`**.
3. **Choose your own password** (at least 8 characters) and complete registration.
4. Log in with `medshelf_demo` and the password you just created.

The 28 sample records are inserted **only when this username is first registered**. The ZIP does **not** contain a predefined demo password. If this account already exists locally, registering again will not reseed its inventory.

Sample records include different categories, quantities, storage locations, and relative expiry dates so that expiry and low-stock conditions can be demonstrated.

## Local database

The application uses an on-device SQLite database named **`medshelf.db`**.

| Table | Purpose |
| --- | --- |
| `users` | Local user accounts and password hashes |
| `preferences` | Per-user expiry and low-stock settings |
| `family_profiles` | Family member profiles |
| `medicines` | Medicine inventory and optional scheduling details |
| `notification_jobs` | References to scheduled local notifications |

The application initializes database tables when first opened and includes migration logic for several added medicine fields.

### Offline functionality

After the app is installed and opened successfully, its **core inventory operations** use local storage and do not require an internet connection. Offline features include login against existing local accounts, browsing medicines, adding/editing/deleting entries, stock adjustments, family profiles, and search/filter/sort operations.

**Limitations:** Local accounts and inventory do not automatically transfer to another phone or reinstall. Notification scheduling depends on device capabilities, permissions, and operating-system behavior. The current code schedules a limited window of upcoming reminders and refreshes schedules on app use and inventory changes.

## Suggested testing checklist

- [ ] Install dependencies successfully with `npm ci`.
- [ ] Launch the application on a phone using Expo.
- [ ] Register a new account and verify that its inventory starts empty.
- [ ] Register `medshelf_demo` on a fresh installation and verify the 28 sample medicines appear.
- [ ] Log out and log back in with the same local credentials.
- [ ] Add, view, edit, and delete a medicine.
- [ ] Search, filter, and sort inventory entries.
- [ ] Mark a medicine as used and confirm that the quantity decreases.
- [ ] Add stock and confirm that the quantity increases.
- [ ] Add and switch family profiles; confirm inventories are separated.
- [ ] Add an optional medicine image and a scheduled time.
- [ ] Check the Dashboard and Alerts views for expected inventory information.
- [ ] Grant notification permissions and test supported local reminders on a physical phone.
- [ ] Disconnect the phone from the internet and verify core inventory functionality.

## ICA 03 requirements covered

The project is designed to address the assignment's core requirements: an individual React Native app, at least five screens, appropriate navigation, a self-created locally stored dataset, dynamic retrieval and display, searching/filtering/detail views, and offline operation without public APIs or online databases.

**Submission responsibilities:** Register a unique project title, maintain an individual GitHub repository, commit and push development work regularly, and verify that the repository contains the complete source code. These requirements cannot be established from the source ZIP alone.

## License

A `LICENSE` file is included in the supplied ZIP. **Review its attribution and terms before publishing**, since its copyright notice refers to Expo / 650 Industries rather than identifying the MedShelf project author.
