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

- **Forms Management**: Navigate to `/forms` to see all historical records. You can **Create, View, Edit, and Delete** forms. Filter by date range, ISO week, company, employee (creator), and approval status. Use the **Search** field to narrow results by text (company, author, date, status, or id).
- **End-of-Day Manager Approval**: Forms are submitted as `PENDING_APPROVAL` for non-manager users. Managers/Admins can approve individually or run a dedicated end-of-day approval action for all pending forms dated up to today. Once approved, forms are locked from editing.
- **Manage Companies & Employees (CRUD)**: `ADMIN` users can navigate to `/companies` and `/users` to perform full CRUD operations.
- **Role access (Web UI)**: `EMPLOYEE` manages forms and profile (status is auto-submitted for review), `MANAGER` can review/approve and access reports, `ADMIN` has full system access including master data management.
- **Section accountability**: Every form section requires selecting employee initials from registered users (no free-text initials), ensuring traceability per section.
- **Cumulative Reports**: Navigate to `/reports`. Admins/Managers can filter by time spans to dissect processed standard vs colored laundry volumes, exact sheet sizes, and overall resource consumption (pockets, plastic bags).
- **App Access Control Center**: Navigate to `/app-permissions`. This premium module allows administrators to manage the mobile application's security posture independently. It features a per-role toggle matrix that dynamically enables or disables features specifically for the Flutter mobile app, enforcing a server-driven UI model.

## Key Assumptions

- **Soft Delete**: It is assumed that companies and employees should not be completely eradicated from the database due to the history of Forms. We use `isActive: false` (soft delete) when items are removed.
- **Authentication**: JWT is stored in `localStorage`. The API service includes an auto-logout interceptor that flushes tokens and redirects out if a 401 Unauthorized occurs.
- **Approval restriction**: The UI enforces that if a form is `APPROVED`, the Edit functionality is disabled to prevent historical tampering.

## Justification of Dependencies

A core requirement was keeping dependencies minimal. Runtime dependencies:

1. **`react` / `react-dom`**: Core UI rendering.
2. **`react-router-dom`**: SPA routing and protected routes.
3. **`@phosphor-icons/react`**: Consistent iconography for fast UX scanning.
4. **`socket.io-client`**: Real-time updates for operational awareness.

*Note: Axios was intentionally omitted in favor of the lightweight native Javascript `fetch` API.*

