import "../../test";
import { TestBed } from "@angular/core/testing";
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { apiInterceptor } from "./api.interceptor";
import { API_BASE, ADMIN_AUTH } from "./api";

describe("apiInterceptor", () => {
  let http: HttpClient;
  let ctrl: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    ctrl = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    ctrl.verify();
  });

  it("unwraps {success, data} envelope", () => {
    let got: unknown;
    http.get(`${API_BASE}/admin/profile`).subscribe((v) => (got = v));
    ctrl.expectOne(`${API_BASE}/admin/profile`).flush({
      success: true,
      message: "ok",
      data: { id: "a1" },
      timestamp: "t",
    });
    expect(got).toEqual({ id: "a1" });
  });

  it("passes through non-envelope body", () => {
    let got: unknown;
    http.get(`${API_BASE}/admin/other`).subscribe((v) => (got = v));
    ctrl.expectOne(`${API_BASE}/admin/other`).flush({ items: [] });
    expect(got).toEqual({ items: [] });
  });

  it("sends credentials on admin auth calls", () => {
    http.post(`${ADMIN_AUTH}/refresh`, {}).subscribe();
    const r = ctrl.expectOne(`${ADMIN_AUTH}/refresh`);
    expect(r.request.withCredentials).toBe(true);
    r.flush({ success: true, data: {} });
  });

  it("does not send credentials on other API calls", () => {
    http.get(`${API_BASE}/admin/users`).subscribe();
    const r = ctrl.expectOne(`${API_BASE}/admin/users`);
    expect(r.request.withCredentials).toBe(false);
    r.flush({ success: true, data: [] });
  });

  it("leaves non-API URL untouched", () => {
    let got: unknown;
    http.get("/assets/x.json").subscribe((v) => (got = v));
    ctrl.expectOne("/assets/x.json").flush({ success: true, data: 1 });
    expect(got).toEqual({ success: true, data: 1 });
  });
});
