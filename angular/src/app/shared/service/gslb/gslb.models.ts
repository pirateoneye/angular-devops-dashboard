/**
 * GSLB / DNS traffic console — data models.
 *
 * Wire states come from `POST /api/gslb/fqdn/detail` (`data[].state`):
 *   "UP" | "OUT OF SERVICE" | "DOWN"
 *
 * `SUSPENDED` is a LOCAL-ONLY UI label. The backend has no "suspended" concept;
 * suspending a service sends `SVC_STATE:"DOWN"` and unsuspending sends
 * `SVC_STATE:"OUT OF SERVICE"`. We render `SUSPENDED` optimistically between the
 * action and the next refresh so the operator sees instant feedback, then the
 * real state re-asserts on refresh.
 */
export type GslbState = 'UP' | 'OUT OF SERVICE' | 'DOWN' | 'SUSPENDED';

/** Internal / external zone. Note the wire param keeps the misspelling `eksternal`. */
export type GslbZone = 'internal' | 'external';

/**
 * A single pool member returned by `fqdn/detail`. The placeholder response in
 * dns.txt only shows svc_name/svr_ip/svr_port/state, but the real suspend
 * payload needs VS_NAME, ID, GTM and requestbytesrate too — so the real detail
 * response is expected to carry them. Everything except the core four is
 * optional so we degrade gracefully if a field is absent.
 */
export interface GslbMember {
  svc_name: string;
  svr_ip: string;
  svr_port: string;
  state: GslbState;
  vs_name?: string;
  id?: number | string;
  gtm?: boolean;
  requestbytesrate?: string | number;
  /** Site label parsed from svc_name (e.g. "WSA2", "GAC-AZ2"); "default" if unparseable. */
  site?: string;
}

/** Members grouped by site for display. */
export interface GslbSite {
  name: string;
  members: GslbMember[];
  up: number;
  oos: number;
  down: number;
  susp: number;
}

/** A cached snapshot of one FQDN's detail. */
export interface GslbSnapshot {
  gtm: boolean;
  members: GslbMember[];
  at: number; // epoch ms when fetched
}

/** An entry in the pickable DNS pool (the known FQDNs an operator can choose to show). */
export interface DnsPoolEntry {
  fqdn: string;
  zone: GslbZone;
}

/** One row in the console = one FQDN. `kind` determines which section + whether actions are allowed. */
export interface GslbCard {
  fqdn: string;
  zone: GslbZone;
  /** 'task' = from get_task/user, actionable (suspend/unsuspend). 'monitor' = user-curated, view-only. */
  kind: 'task' | 'monitor';
  expanded: boolean;
  snapshot: GslbSnapshot | null;
  loading: boolean;      // a fetch is in flight (first load)
  refreshing: boolean;  // a background SWR refresh is in flight
  error: string | null;
  lastUpdated: number | null; // epoch ms
  /** Per-card two-click confirm arming (which action is armed) — task cards only. */
  armed: 'suspend' | 'unsuspend' | null;
}

/**
 * `GET /api/gslb/obj/get_task/user?show_expired=false` response shape.
 * INFERRED from paimon-dupe's working parser (no response sample in dns.txt).
 * `loadTasks()` defends against `any[] | {data} | {tasks}` so a real probe
 * surfaces the shape in dev without crashing.
 */
export interface GslbTask {
  no?: number;
  status?: string;
  flag?: string;
  fqdn?: string;
  Changeid?: number;
  start_time?: string;
  end_time?: string;
  as_api?: number;
  Payload?: {
    FQDN: string;
    SR?: number;
    SVC_NAME?: string;
    SVC_STATE?: string | null;
    SVC_TYPE?: string;
    SVR_IP?: string;
    SVC_PORT?: string;
    VS_NAME?: string;
    GTM?: boolean;
  }[];
}

/**
 * `POST /api/gslb/fun/suspend|unsuspend?type=…` body.
 * UPPER_CASE keys per the real cURL in dns.txt.
 * suspend  → SVC_STATE: "DOWN"
 * unsuspend→ SVC_STATE: "OUT OF SERVICE"
 */
export interface SuspendPayload {
  SVC_NAME: string;
  SVC_STATE: 'DOWN' | 'OUT OF SERVICE';
  PORT: string | number;
  VS_NAME: string;
  FQDN: string;
  IP: string;
  GTM: boolean;
  requestbytesrate: string | number;
  ID: number | string;
}

/** `POST /api/gslb/gtmpoolmemberdetail` body. */
export interface GtmDetailRequest {
  domain: string;
  pool_member_name: string;
  flag: GslbZone | 'eksternal';
}