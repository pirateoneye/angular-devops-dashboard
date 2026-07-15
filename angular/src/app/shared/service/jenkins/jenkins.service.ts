// jenkins.service.ts
// Injectable service for Jenkins REST API. Handles crumb, job discovery,
// parameter metadata, and build triggering with CORS proxy fallback.

import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import {
  JenkinsJob,
  JenkinsParamDef,
  JenkinsCrumb,
} from './jenkins.models';

const BUILD_CRUMB_FIELD = 'Jenkins-Crumb';


const LS_JENKINS_USER = 'jenkins.username';
const LS_JENKINS_PASS = 'jenkins.password';
interface RawParamDef {
  name: string;
  type: string;
  description?: string;
  defaultParameterValue?: { value?: string };
  choices?: string[];
}

interface JobsResponse {
  jobs: RawJob[];
}

interface RawJob {
  name: string;
  displayName?: string;
  url: string;
  color: string;
  _class?: string;
}

interface ParamsResponse {
  property: Array<{
    parameterDefinitions?: RawParamDef[];
  }>;
}

@Injectable({ providedIn: 'root' })
export class JenkinsService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly username = signal('');
  readonly password = signal('');
  readonly authed = computed(() => this.username().length > 0 && this.password().length > 0);

  constructor() {
    this.restoreSession();
  }

  async loginWithCredentials(username: string, password: string, remember: boolean): Promise<boolean> {
    const u = username.trim();
    if (!u || !password) return false;
    this.username.set(u);
    this.password.set(password);
    if (remember && this.isBrowser) {
      localStorage.setItem(LS_JENKINS_USER, u);
      localStorage.setItem(LS_JENKINS_PASS, password);
    }
    return true;
  }

  logout(): void {
    this.username.set('');
    this.password.set('');
    if (this.isBrowser) {
      localStorage.removeItem(LS_JENKINS_USER);
      localStorage.removeItem(LS_JENKINS_PASS);
    }
  }

  private restoreSession(): void {
    if (!this.isBrowser) return;
    const u = localStorage.getItem(LS_JENKINS_USER);
    const p = localStorage.getItem(LS_JENKINS_PASS);
    if (u && p) {
      this.username.set(u);
      this.password.set(p);
    }
  }

  private authHeaders(): Record<string, string> {
    const u = this.username();
    const p = this.password();
    if (!u || !p) return {};
    try {
      return { Authorization: `Basic ${btoa(`${u}:${p}`)}` };
    } catch {
      return {};
    }
  }


  /** GET {url}/crumbIssuer/api/json */
  fetchCrumb(jenkinsUrl: string): Observable<JenkinsCrumb> {
    const url = this.stripTrailingSlash(jenkinsUrl) + '/crumbIssuer/api/json';
    return this.http
      .get<JenkinsCrumb>(url, { observe: 'body' as const, headers: this.authHeaders() })
      .pipe(catchError((err) => this.handleError(err, jenkinsUrl, 'fetching CSRF crumb')));
  }

  /** Fallback crumb fetch through backend proxy at /api/jenkins/crumb */
  proxyCrumb(jenkinsUrl: string): Observable<JenkinsCrumb> {
    const url = `/api/jenkins/crumb?url=${encodeURIComponent(jenkinsUrl)}`;
    return this.http
      .get<JenkinsCrumb>(url, { headers: this.authHeaders() })
      .pipe(catchError((err) => this.handleError(err, jenkinsUrl, 'fetching CSRF crumb via proxy')));
  }

  /** GET {url}/api/json?tree=jobs[name,url,color,displayName] — filters out folder entries. */
  fetchJobs(jenkinsUrl: string): Observable<JenkinsJob[]> {
    const base = this.stripTrailingSlash(jenkinsUrl);
    const tree = 'jobs[name,url,color,displayName,_class]';
    const apiUrl = `${base}/api/json?tree=${encodeURIComponent(tree)}`;

    return this.http.get<JobsResponse>(apiUrl, { headers: this.authHeaders() }).pipe(
      map((res) => {
        if (!res.jobs || !Array.isArray(res.jobs)) return [];
        return res.jobs
          .filter(
            (j) => !j._class || !j._class.includes('Folder'),
          )
          .map(this.normalizeJob);
      }),
      catchError((err) => this.handleError(err, jenkinsUrl, 'loading job list')),
    );
  }

  /** GET {url}/job/{jobPath}/api/json?tree=property[parameterDefinitions[...]] */
  fetchJobParams(jenkinsUrl: string, jobPath: string): Observable<JenkinsParamDef[]> {
    // Encode each segment of the path (handle folder/job-name)
    const encodedPath = jobPath
      .split('/')
      .map((s) => encodeURIComponent(s))
      .join('/');
    const base = this.stripTrailingSlash(jenkinsUrl);
    const tree = 'property[parameterDefinitions[name,type,description,defaultParameterValue[value],choices]]';
    const apiUrl = `${base}/job/${encodedPath}/api/json?tree=${encodeURIComponent(tree)}`;

    return this.http.get<ParamsResponse>(apiUrl, { headers: this.authHeaders() }).pipe(
      map((res) => {
        const defs = res.property?.find((p) => p.parameterDefinitions)?.parameterDefinitions;
        if (!defs || defs.length === 0) return [];
        return defs.map(this.normalizeParamDef);
      }),
      catchError((err) => this.handleError(err, jenkinsUrl, `loading params for job ${jobPath}`)),
    );
  }

  /** POST {url}/job/{jobPath}/buildWithParameters?delay=0sec */
  triggerBuild(
    jenkinsUrl: string,
    jobPath: string,
    crumb: string,
    params: Record<string, string | boolean>,
  ): Observable<HttpResponse<string>> {
    const encodedPath = jobPath
      .split('/')
      .map((s) => encodeURIComponent(s))
      .join('/');
    const base = this.stripTrailingSlash(jenkinsUrl);
    const buildUrl = `${base}/job/${encodedPath}/buildWithParameters?delay=0sec`;

    const body = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        body.set(key, String(value));
      }
    }

    const headers = {
      ...this.authHeaders(),
      [BUILD_CRUMB_FIELD]: crumb,
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    return this.http
      .post(buildUrl, body.toString(), {
        headers,
        observe: 'response' as const,
        responseType: 'text' as const,
      })
      .pipe(
        catchError((err: HttpErrorResponse) => {
          // 403 — crumb likely expired, let caller retry
          if (err.status === 403) {
            return throwError(() => new JenkinsCrumbExpiredError(err));
          }
          return this.handleError(err, jenkinsUrl, 'triggering build');
        }),
      );
  }

  /** POST /job/{jobPath}/build for parameterless jobs */
  triggerBuildNoParams(
    jenkinsUrl: string,
    jobPath: string,
    crumb: string,
  ): Observable<HttpResponse<string>> {
    const encodedPath = jobPath
      .split('/')
      .map((s) => encodeURIComponent(s))
      .join('/');
    const base = this.stripTrailingSlash(jenkinsUrl);
    const buildUrl = `${base}/job/${encodedPath}/build`;

    const headers = { ...this.authHeaders(), [BUILD_CRUMB_FIELD]: crumb };

    return this.http
      .post(buildUrl, null, {
        headers,
        observe: 'response' as const,
        responseType: 'text' as const,
      })
      .pipe(
        catchError((err: HttpErrorResponse) => {
          if (err.status === 403) {
            return throwError(() => new JenkinsCrumbExpiredError(err));
          }
          return this.handleError(err, jenkinsUrl, 'triggering build');
        }),
      );
  }

  // ---------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------

  private stripTrailingSlash(s: string): string {
    return s.endsWith('/') ? s.slice(0, -1) : s;
  }

  private normalizeJob(raw: RawJob): JenkinsJob {
    return {
      name: raw.displayName || raw.name,
      url: raw.url,
      color: raw.color || 'notbuilt',
    };
  }

  private normalizeParamDef(raw: RawParamDef): JenkinsParamDef {
    const def: JenkinsParamDef = {
      name: raw.name,
      type: raw.type as JenkinsParamDef['type'],
      description: raw.description,
    };

    if (raw.defaultParameterValue?.value !== undefined) {
      def.defaultValue = String(raw.defaultParameterValue.value);
    }
    if (raw.choices && raw.choices.length > 0) {
      def.choices = raw.choices;
    }

    return def;
  }

  private handleError(
    err: unknown,
    jenkinsUrl: string,
    context: string,
  ): Observable<never> {
    let message = `Error ${context}`;
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        message = `Cannot reach ${jenkinsUrl} — check URL and network`;
      } else {
        message = `${context}: HTTP ${err.status} ${err.statusText}`;
      }
    } else if (err instanceof Error) {
      message = err.message;
    }
    return throwError(() => new Error(message));
  }
}

/** Thrown when triggerBuild gets 403 so the caller can re-fetch crumb and retry. */
export class JenkinsCrumbExpiredError extends Error {
  readonly originalError: HttpErrorResponse;
  constructor(err: HttpErrorResponse) {
    super('Jenkins CSRF crumb expired (403), retry with fresh crumb');
    this.name = 'JenkinsCrumbExpiredError';
    this.originalError = err;
  }
}
