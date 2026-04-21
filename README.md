# Orchestrator Process Dashboard

A professional, enterprise-grade web application that displays all UiPath Orchestrator processes with comprehensive details in a clean, information-dense dashboard. Built with React, TypeScript, and the official UiPath SDK.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Balamanikanta1210/orchestrator-process-latest)

## Overview

The Orchestrator Process Dashboard provides a table-based layout showing process metadata, execution statistics, and folder organization. Users can view process details, filter by folder, sort by various criteria, and access quick actions for process management. The interface follows enterprise SaaS design patterns with neutral color schemes, compact spacing, and efficient information display optimized for business users managing automation workflows.

## Key Features

- **Comprehensive Process View**: Display all Orchestrator processes with detailed metadata including version, folder, package type, target framework, and robot size
- **Advanced Filtering**: Filter processes by folder with dynamic folder discovery from process data
- **Real-time Search**: Client-side search functionality for instant process filtering by name
- **Sortable Columns**: Sort processes by name, version, or last modified date
- **Pagination Support**: Efficient data loading with configurable page sizes
- **Enterprise UI**: Clean, professional design with neutral color palette and information-dense layouts
- **Responsive Design**: Optimized for desktop workflows with horizontal scrolling on smaller screens

## Technology Stack

### Core Framework
- **React 18** - Modern UI library with hooks and concurrent features
- **TypeScript 5.8** - Type-safe development with full IDE support
- **Vite 6** - Lightning-fast build tool and dev server

### UiPath Integration
- **@uipath/uipath-typescript** - Official UiPath SDK for Orchestrator API integration
- OAuth 2.0 authentication with automatic token refresh
- Type-safe service interfaces for Processes, Assets, Queues, and more

### UI Components & Styling
- **Tailwind CSS 4** - Utility-first CSS framework
- **shadcn/ui** - High-quality, accessible React components built on Radix UI
- **Lucide React** - Beautiful, consistent icon library
- **Framer Motion** - Smooth animations and transitions

### State Management
- **Zustand** - Lightweight, scalable state management
- **React Hook Form** - Performant form handling with validation
- **Zod** - TypeScript-first schema validation

### Deployment
- **Cloudflare Pages** - Global edge deployment with zero configuration
- **Wrangler** - Cloudflare's CLI for deployment and management

## Prerequisites

- **Bun** 1.0 or higher ([install instructions](https://bun.sh))
- **UiPath Cloud Account** with Orchestrator access
- **OAuth Client Credentials** from UiPath Cloud (Client ID and scopes)

## Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd orchestrator-process-dashboard
```

2. **Install dependencies**

```bash
bun install
```

3. **Configure environment variables**

Create a `.env` file in the project root (or copy from `.env.example`):

```env
VITE_UIPATH_BASE_URL=https://api.uipath.com
VITE_UIPATH_ORG_NAME=your-org-name
VITE_UIPATH_TENANT_NAME=your-tenant-name
VITE_UIPATH_CLIENT_ID=your-client-id
VITE_UIPATH_REDIRECT_URI=http://localhost:3000
VITE_UIPATH_SCOPE=OR.Execution.Read OR.Folders
```

**Required OAuth Scopes:**
- `OR.Execution` or `OR.Execution.Read` - Read process definitions
- `OR.Folders` - Access folder information

4. **Start the development server**

```bash
bun run dev
```

The application will be available at `http://localhost:3000`

## Usage

### First-Time Setup

1. **Launch the application** - Navigate to `http://localhost:3000`
2. **Authenticate** - Click the login button to authenticate with UiPath Cloud via OAuth
3. **Grant permissions** - Approve the requested scopes in the UiPath consent screen
4. **View processes** - After authentication, the dashboard will load all available processes

### Dashboard Features

**Folder Filtering**
- Use the folder dropdown at the top to filter processes by organizational folder
- Select "All Folders" to view processes across all folders
- Folder list is dynamically populated from available process data

**Search**
- Type in the search box to filter processes by name in real-time
- Search is case-insensitive and matches partial names

**Sorting**
- Click column headers to sort by process name, version, or last modified date
- Click again to reverse sort order
- Visual indicators show the active sort column and direction

**Pagination**
- Navigate through pages using the pagination controls at the bottom
- Configurable page size (default: 50 processes per page)

**Process Details**
Each row displays:
- Process name and package key
- Version number with latest version indicator
- Folder assignment
- Package type (Process, Agent, Case Management, etc.)
- Target framework (Legacy, Windows, Portable)
- Robot size (Small, Standard, Medium, Large)
- Auto-update status
- Last modified timestamp

## Development

### Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── ui/           # shadcn/ui components
│   └── layout/       # Layout components (AppLayout, etc.)
├── hooks/            # Custom React hooks
│   ├── useAuth.tsx   # OAuth authentication hook
│   └── use-theme.ts  # Theme management
├── pages/            # Page components
│   └── HomePage.tsx  # Main dashboard page
├── lib/              # Utility functions
└── index.css         # Global styles and Tailwind config
```

### Available Scripts

```bash
# Start development server
bun run dev

# Build for production
bun run build

# Preview production build locally
bun run preview

# Run linter
bun run lint
```

### Adding New Features

The application follows a service-based architecture using the UiPath SDK:

```typescript
import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Processes } from '@uipath/uipath-typescript/processes';

function MyComponent() {
  const { sdk } = useAuth();
  const processes = useMemo(() => new Processes(sdk), [sdk]);
  
  // Use the service to fetch data
  const loadData = async () => {
    const result = await processes.getAll({ pageSize: 50 });
    return result.items;
  };
}
```

### SDK Reference

The project includes comprehensive SDK documentation in `prompts/sdk-reference/`:
- `orchestrator.md` - Processes, Assets, Queues, Buckets
- `maestro.md` - Process instances, cases, incidents
- `action-center.md` - Tasks and human-in-the-loop workflows
- `data-fabric.md` - Entities and data management
- `patterns.md` - Common patterns (polling, BPMN rendering, etc.)

## Deployment

### Deploy to Cloudflare Pages

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Balamanikanta1210/orchestrator-process-latest)

**Manual Deployment:**

1. **Build the project**

```bash
bun run build
```

2. **Deploy to Cloudflare Pages**

```bash
bunx wrangler pages deploy dist
```

3. **Configure environment variables** in the Cloudflare Pages dashboard:
   - `VITE_UIPATH_BASE_URL`
   - `VITE_UIPATH_ORG_NAME`
   - `VITE_UIPATH_TENANT_NAME`
   - `VITE_UIPATH_CLIENT_ID`
   - `VITE_UIPATH_REDIRECT_URI` (set to your production URL)
   - `VITE_UIPATH_SCOPE`

4. **Update OAuth redirect URI** in UiPath Cloud to include your production URL

### Continuous Deployment

Connect your repository to Cloudflare Pages for automatic deployments:

1. Log in to the Cloudflare dashboard
2. Navigate to Pages and create a new project
3. Connect your Git repository
4. Configure build settings:
   - **Build command**: `bun run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/`
5. Add environment variables
6. Deploy

Every push to your main branch will trigger a new deployment.

## Configuration

### OAuth Configuration

Register an OAuth application in UiPath Cloud:

1. Navigate to **Admin** → **External Applications**
2. Click **Add Application**
3. Configure:
   - **Application Type**: Confidential Client
   - **Redirect URIs**: Add your application URLs (dev and production)
   - **Scopes**: Select required scopes (OR.Execution.Read, OR.Folders, etc.)
4. Copy the **Client ID** and update your `.env` file

### Theme Customization

The application uses CSS custom properties for theming. Modify `src/index.css` to customize colors:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --primary: 0 0% 9%;
  /* ... more theme variables */
}
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Security

- OAuth 2.0 authentication with PKCE flow
- Tokens stored in sessionStorage (cleared on tab close)
- Automatic token refresh on expiration
- No sensitive data persisted to localStorage
- HTTPS required for production deployments

## Troubleshooting

**Authentication fails with "Invalid redirect URI"**
- Ensure `VITE_UIPATH_REDIRECT_URI` matches the URI registered in UiPath Cloud
- Check that the protocol (http/https) and port match exactly

**"No processes found" after successful login**
- Verify the authenticated user has access to at least one folder
- Check that the required OAuth scopes are granted
- Ensure the tenant name in `.env` is correct

**Build fails with TypeScript errors**
- Run `bun install` to ensure all dependencies are up to date
- Check that TypeScript version is 5.8 or higher
- Clear the build cache: `rm -rf node_modules/.vite`

## License

This project is licensed under the MIT License.

## Support

For issues related to:
- **UiPath SDK**: Refer to the official [UiPath SDK documentation](https://docs.uipath.com)
- **Application bugs**: Open an issue in this repository
- **Feature requests**: Open an issue with the "enhancement" label

## Acknowledgments

Built with:
- [UiPath TypeScript SDK](https://www.npmjs.com/package/@uipath/uipath-typescript)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Cloudflare Pages](https://pages.cloudflare.com)