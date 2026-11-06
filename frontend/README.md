# Kivora Finance frontend

Responsive React + Vite frontend for the Kivora personal finance application. It uses the existing Spring Boot API routes:

- `GET /api/reports/summary`
- `GET /api/transactions`
- `POST /api/transactions`

## Run locally

```sh
npm install
npm run dev
```

## Pages

- Dashboard: balance, income, payments, savings progress, and cash flow grouped from transaction history.
- Transactions: searchable and filterable history with date, time, vendor, payment/deposit type, and amount; transaction entry opens in a validated modal.
- Reports: income and payments chart based on transaction history, plus net cash flow and summary values.
- Settings: profile, currency preference, weekly insight toggle, and account management.

Currency preference is saved in local storage and applied to dashboard, transaction, and report amounts. The finance views keep using the existing Spring Boot endpoints; this frontend does not add new API routes.
