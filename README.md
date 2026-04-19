# Laundry Web Dashboard

This is the web application counterpart for the Laundry digitisation challenge. It provides a clean, modern, and practical single-page admin dashboard for Managers and Admins to manage Forms, Companies, Employees, and view cumulative Reports.

## Setup & Installation

1. **Prerequisites**: Ensure you have Node.js and a package manager (`npm`, `yarn`, or `pnpm`) installed.
2. **Install Dependencies**:
   Open a terminal in the `Laundry_Web` directory and run:
   ```bash
   npm install
   ```
3. **Run the Development Server**:
   ```bash
   npm run dev
   ```
4. **Access the Application**:
   Open your browser and navigate to `http://localhost:5173`.

## Key Features & Example Usage

- **Forms Management**: Navigate to `/forms` to see all historical records. You can **Create, View, Edit, and Delete** forms. Use the advanced Search panel to filter out records accurately by:
  - Custom Date Range or exact Week picker (ISO Standard)
  - Company
  - Employee (Creator)
  - Approval Status
- **End-of-Day Manager Approval**: When a Form is completed, a user with the `MANAGER` or `ADMIN` role can click the "View" action (eye icon). Inside the detail view, an "Approve Form" button strictly upgrades the status to `APPROVED` and locks it against future modifications natively.
- **Manage Companies & Employees (CRUD)**: Authorized Admins can navigate to `/companies` and `/employees` to perform full Inline Creation, Editing (Updates), and Deletion. Note: `Delete` logic invokes a soft-delete under the hook to protect statistical integrity.
- **Cumulative Reports**: Navigate to `/reports`. Admins/Managers can filter by time spans to dissect processed standard vs colored laundry volumes, exact sheet sizes, and overall resource consumption (pockets, plastic bags).
- **App Access Control Center**: Navigate to `/app-permissions`. This premium module allows administrators to manage the mobile application's security posture independently. It features a per-role toggle matrix that dynamically enables or disables features specifically for the Flutter mobile app, enforcing a server-driven UI model.

## Key Assumptions

- **Soft Delete**: It is assumed that companies and employees should not be completely eradicated from the database due to the history of Forms. We use `isActive: false` (soft delete) when items are removed.
- **Authentication**: JWT is stored in `localStorage`. The API service includes an auto-logout interceptor that flushes tokens and redirects out if a 401 Unauthorized occurs.
- **Approval restriction**: The UI enforces that if a form is `APPROVED`, the Edit functionality is disabled to prevent historical tampering.

## Justification of Dependencies

A core requirement was keeping dependencies to a strict minimal. Only two were added:

1. **`react-router-dom`**: Essential for meeting the Single Page Application (SPA) requirement, avoiding deeply complicated manual navigation and window-state management.
2. **`@phosphor-icons/react`**: Provides clean, consistent UI iconography across the application without the overhead of sourcing and managing static SVGs manually, adhering to the "Modern clean UI" focus.
*Note: Axios was intentionally omitted in favor of the lightweight native Javascript `fetch` API.*
