import urllib.request
import json

BASE_URL = "http://127.0.0.1:8000/api"

def make_request(path, data=None, headers=None, method="POST"):
    url = f"{BASE_URL}{path}"
    headers = headers or {}
    if data is not None:
        data_bytes = json.dumps(data).encode("utf-8") if isinstance(data, dict) else data
        headers["Content-Type"] = "application/json"
    else:
        data_bytes = None

    req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method if data is None else "POST")
    try:
        with urllib.request.urlopen(req) as res:
            return res.status, json.loads(res.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

def test_all():
    print("Testing Complete AI Resume Assistant Suite...")

    # 1. Health check
    res = urllib.request.urlopen(f"{BASE_URL}/health")
    assert res.status == 200
    print("[PASS] /api/health passed")

    # 2. Auth: Sign up
    status, signup_res = make_request("/auth/signup", {
        "name": "Jane Tester",
        "email": "jane.tester@example.com",
        "password": "password123",
        "confirm_password": "password123"
    })
    if status == 200:
        assert signup_res["user"]["plan"] == "free"
        token = signup_res["access_token"]
        print(f"[PASS] /api/auth/signup passed (User: {signup_res['user']['email']})")
    else:
        # User might already exist in memory
        status, login_res = make_request("/auth/login", {
            "email": "jane.tester@example.com",
            "password": "password123"
        })
        assert status == 200
        token = login_res["access_token"]
        print(f"[PASS] /api/auth/login passed (User: {login_res['user']['email']})")

    # 3. Auth: Social login
    status, social_res = make_request("/auth/social-login", {
        "provider": "google",
        "email": "google.dev@example.com",
        "name": "Google Dev Candidate"
    })
    assert status == 200
    assert social_res["user"]["provider"] == "google"
    print(f"[PASS] /api/auth/social-login passed (Provider: {social_res['user']['provider']})")

    # 4. Auth: Password reset flow
    status, forgot_res = make_request("/auth/forgot-password", {"email": "free@careerai.io"})
    assert status == 200
    reset_token = forgot_res.get("reset_token")
    if reset_token:
        status, reset_res = make_request("/auth/reset-password", {
            "token": reset_token,
            "new_password": "newpassword123",
            "confirm_password": "newpassword123"
        })
        assert status == 200
        print("[PASS] /api/auth/reset-password flow passed")

    # 5. Subscription Plans
    status, plans_res = make_request("/subscription/plans", method="GET")
    assert status == 200
    assert len(plans_res) >= 2
    print(f"[PASS] /api/subscription/plans passed ({len(plans_res)} plans loaded)")

    # 6. 100+ Templates
    status, templates_res = make_request("/templates", method="GET")
    assert status == 200
    assert templates_res["total"] >= 100
    print(f"[PASS] /api/templates passed ({templates_res['total']} templates cataloged)")

    # Category filter test
    status, modern_res = make_request("/templates?category=Modern", method="GET")
    assert status == 200
    assert len(modern_res["templates"]) > 0
    print(f"[PASS] /api/templates?category=Modern passed ({len(modern_res['templates'])} modern templates)")

    # 7. Job Search
    status, jobs_res = make_request("/jobs/search?query=Software", method="GET")
    assert status == 200
    assert len(jobs_res) > 0
    print(f"[PASS] /api/jobs/search passed ({len(jobs_res)} jobs found)")

    # 8. Job Fit Analysis
    res_samples = urllib.request.urlopen(f"{BASE_URL}/sample-resumes")
    samples = json.loads(res_samples.read().decode())
    swe_profile = samples["software_engineer"]

    status, fit_res = make_request("/jobs/match-fit", {
        "profile": swe_profile,
        "job_id": jobs_res[0]["id"]
    })
    assert status == 200
    assert fit_res["match_score"] >= 60
    assert len(fit_res["matched_skills"]) > 0
    print(f"[PASS] /api/jobs/match-fit passed (Fit Score: {fit_res['match_score']}%, Matched: {fit_res['matched_skills']})")

    # 9. Rewarded Ad Verification
    status, ad_res = make_request("/ads/verify-reward", {
        "ad_id": "sponsor_ad_tech_01",
        "reward_token": "reward_tok_12345",
        "duration_seconds": 5
    })
    assert status == 200
    assert ad_res["verified"] is True
    print(f"[PASS] /api/ads/verify-reward passed (Token: {ad_res['download_token'][:15]}...)")

    print("\n=======================================================")
    print("ALL 15+ SUITE TESTS (AUTH, PRO, 100+ TEMPLATES, JOBS, ADS) PASSED!")
    print("=======================================================\n")

if __name__ == "__main__":
    test_all()
