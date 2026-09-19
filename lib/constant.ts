import {
  CalendarDaysIcon,
  ContactRoundIcon,
  FolderIcon,
  HardDriveIcon,
  ImageIcon,
  ListChecksIcon,
  MailIcon,
  MessageSquareIcon,
  StickyNoteIcon,
  UsersRoundIcon,
  VideoIcon,
  FolderTreeIcon,
  type LucideIcon,
} from "lucide-react"

// Single source of truth for static values (arrays, numbers, JSON).
// Components import from here; do not inline magic values in components.

export const APP_NAME = "Takeout Viewer"

export const DESKTOP_ONLY_MESSAGE = {
  title: "Desktop only",
  description:
    "This app can only be accessed from a desktop or laptop. Please open it on a larger screen.",
} as const

export type ModulePriority = "P0" | "P1" | "P2"

export interface ModuleDefinition {
  id: string
  label: string
  href: string
  icon: LucideIcon
  priority: ModulePriority
  /** Top-level Takeout folder names this module reads. */
  sourceFolders: readonly string[]
}

export const MODULES: readonly ModuleDefinition[] = [
  { id: "mail", label: "Mail", href: "/mail", icon: MailIcon, priority: "P0", sourceFolders: ["Mail"] },
  { id: "chat", label: "Chat", href: "/chat", icon: MessageSquareIcon, priority: "P0", sourceFolders: ["Google Chat"] },
  { id: "calendar", label: "Calendar", href: "/calendar", icon: CalendarDaysIcon, priority: "P0", sourceFolders: ["Calendar"] },
  { id: "drive", label: "Drive", href: "/drive", icon: HardDriveIcon, priority: "P0", sourceFolders: ["Drive"] },
  { id: "contacts", label: "Contacts", href: "/contacts", icon: ContactRoundIcon, priority: "P2", sourceFolders: ["Contacts"] },
  { id: "keep", label: "Keep", href: "/keep", icon: StickyNoteIcon, priority: "P2", sourceFolders: ["Keep"] },
  { id: "tasks", label: "Tasks", href: "/tasks", icon: ListChecksIcon, priority: "P2", sourceFolders: ["Tasks"] },
  { id: "photos", label: "Photos", href: "/photos", icon: ImageIcon, priority: "P2", sourceFolders: ["Google Photos"] },
  { id: "groups", label: "Groups", href: "/groups", icon: UsersRoundIcon, priority: "P2", sourceFolders: ["Groups"] },
  { id: "youtube", label: "YouTube", href: "/youtube", icon: VideoIcon, priority: "P2", sourceFolders: ["YouTube and YouTube Music"] },
  { id: "browse", label: "Other data", href: "/browse", icon: FolderTreeIcon, priority: "P2", sourceFolders: [] },
] as const

export const HOME_NAV = { label: "Home", href: "/", icon: FolderIcon } as const

export const PAGINATION = {
  defaultPageSize: 50,
  pageSizeOptions: [25, 50, 100],
} as const

/** URL search params that drive server-side table state. */
export const TABLE_PARAMS = {
  page: "page",
  pageSize: "pageSize",
  sort: "sort",
  dir: "dir",
  search: "q",
} as const

/** Sentinel value for "no filter" in filter dropdowns (Select needs a non-empty value). */
export const FILTER_ALL_VALUE = "__all__"

export interface TableFilterOption {
  value: string
  label: string
}

/** Serializable filter config; `id` is used as the URL param name. */
export interface TableFilterDefinition {
  id: string
  label: string
  options: readonly TableFilterOption[]
}

export const TABLE_TEXT = {
  empty: "No results",
  previous: "Previous",
  next: "Next",
  rowsPerPage: "Rows per page",
  searchPlaceholder: "Search…",
  jumpToPage: "Go to page",
  clearFilters: "Clear",
  allOption: "All",
} as const

export const SKELETON_ROWS = {
  table: 10,
  list: 12,
  cards: 8,
  chatMessages: 8,
  photos: 18,
  calendarWeeks: 5,
} as const

export const SEARCH = {
  debounceMs: 300,
  minQueryLength: 2,
} as const

export const SESSION = {
  cookieName: "takeout_session",
  maxAgeSeconds: 60 * 60 * 24 * 7,
} as const

export const UNITS = {
  bytes: ["B", "KB", "MB", "GB", "TB"],
  bytesBase: 1024,
} as const

export const DEFAULT_LOCALE = "en-US"
export const DEFAULT_CURRENCY = "USD"

export const MAIL = {
  /** Max plain-text characters per message stored in the FTS index. */
  ftsBodyCap: 64 * 1024,
} as const

export const INDEX_ERROR_FILTERS: readonly TableFilterDefinition[] = [
  {
    id: "module",
    label: "Module",
    options: [
      { value: "mail", label: "Mail" },
      { value: "chat", label: "Chat" },
      { value: "calendar", label: "Calendar" },
      { value: "drive", label: "Drive" },
    ],
  },
]

/** MIME types for files served inline (images, video). Everything else is served as a download. */
export const INLINE_MIME_TYPES: Readonly<Record<string, string>> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".heic": "image/heic",
  ".mp4": "video/mp4",
  ".m4v": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
}

export const DEFAULT_DOWNLOAD_MIME = "application/octet-stream"

export const ENV = {
  takeoutDir: "TAKEOUT_DIR",
  dataDir: "DATA_DIR",
  allowedHosts: "ALLOWED_HOSTS",
} as const

export const DEFAULT_DIRS = {
  takeout: "./takeout",
  data: "./.data",
} as const

/** Folder name Google wraps a multi-product export in. */
export const TAKEOUT_WRAPPER_FOLDER = "Takeout"

export const DB_FILE_NAME = "index.db"
export const AUTH_FILE_NAME = "auth.json"

export type ModuleState = "pending" | "indexing" | "ready" | "failed" | "missing"

export const MODULE_STATE_LABELS: Record<ModuleState, string> = {
  pending: "Not indexed",
  indexing: "Indexing",
  ready: "Ready",
  failed: "Failed",
  missing: "Not in export",
}

export const ALLOWED_LOCAL_HOSTS = ["localhost", "127.0.0.1", "[::1]"] as const

export const AUTH = {
  minPasswordLength: 8,
  scrypt: { keyLength: 64, cost: 16384, blockSize: 8, parallelization: 1 },
  saltBytes: 16,
  tokenBytes: 32,
  /** Progressive delay after repeated wrong passwords. */
  rateLimit: { freeAttempts: 3, baseDelayMs: 1000, maxDelayMs: 30000, windowMs: 15 * 60 * 1000 },
  publicPaths: ["/setup", "/login"],
} as const

export const AUTH_TEXT = {
  setupTitle: "Set up a password",
  setupDescription: "This password protects your Takeout data on this machine. It is stored only as a salted hash and cannot be recovered; to reset it, delete auth.json in the data folder.",
  loginTitle: "Enter your password",
  wrongPassword: "Incorrect password.",
  tooShort: "Use at least 8 characters.",
  mismatch: "Passwords do not match.",
  tooMany: "Too many attempts. Try again in a moment.",
} as const

export const THUMBNAIL = {
  width: 320,
  quality: 70,
  /** Guard against decompression bombs (pixels). */
  maxInputPixels: 268_402_689,
  dirName: "thumbs",
} as const

export const INDEXING_REFRESH_MS = 2000
