---
description: Start all services (Server, Client, Mothership) and monitor logs
---

To start the entire application stack and see the logs for all services in a single terminal window, run the following command in the root directory:

```bash
npm start
```

This command uses `concurrently` to run the following services in parallel:
- **Server**: Backend API (Blue logs)
- **Client**: Storefront (Magenta logs)
- **Mothership**: Admin Panel (Green logs)

// turbo
npm start
