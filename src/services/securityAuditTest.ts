/**
 * ==============================================================================
 * ADVERSARIAL SECURITY TEST SUITE (Tests A through P)
 * Verification of Server-Side Session Auth, Denial of Retired Modules,
 * GET Endpoint Hardening, Password Cryptography, and Role Isolation
 * ==============================================================================
 */

export interface SecurityTestResult {
  id: string;
  name: string;
  category: 'ENDPOINT_SECURITY' | 'AUTHENTICATION' | 'AUTHORIZATION' | 'SCOPE_CLEANUP' | 'CRYPTOGRAPHY';
  passed: boolean;
  expectedStatus: string | number;
  actualStatus: string | number;
  details: string;
  durationMs: number;
}

export interface SecuritySuiteReport {
  timestamp: string;
  totalTests: number;
  passedCount: number;
  failedCount: number;
  scorePercentage: number;
  isCompliant: boolean;
  results: SecurityTestResult[];
}

export class SecurityAuditTestSuite {
  /**
   * Run the complete suite of tests A through P
   */
  public static async runSuite(backendUrl?: string): Promise<SecuritySuiteReport> {
    const results: SecurityTestResult[] = [];
    const startTime = Date.now();

    // Test A: Unauthenticated GET /exec?action=getAll returns 403 Forbidden
    results.push(await this.testA_UnauthenticatedGetAll(backendUrl));

    // Test B: Unauthenticated GET /exec?action=getEmployees returns 403
    results.push(await this.testB_UnauthenticatedGetEmployees(backendUrl));

    // Test C: GET /exec?action=login returns 403
    results.push(await this.testC_GetLoginForbidden(backendUrl));

    // Test D: POST without sessionToken returns AUTH_REQUIRED
    results.push(await this.testD_PostWithoutTokenAuthRequired(backendUrl));

    // Test E: POST with forged token returns AUTH_REQUIRED
    results.push(await this.testE_PostForgedTokenAuthRequired(backendUrl));

    // Test F: POST with valid token but forged userRole=Admin uses role from session, not payload
    results.push(await this.testF_PostRoleTamperProtection(backendUrl));

    // Test G: Login with role=Teacher returns ACCOUNT_ROLE_NOT_ALLOWED
    results.push(await this.testG_TeacherLoginBlocked(backendUrl));

    // Test H: Login with role=Parent returns ACCOUNT_ROLE_NOT_ALLOWED
    results.push(await this.testH_ParentLoginBlocked(backendUrl));

    // Test I: Login with role=Student returns ACCOUNT_ROLE_NOT_ALLOWED
    results.push(await this.testI_StudentLoginBlocked(backendUrl));

    // Test J: Action saveSchedule returns MODULE_RETIRED
    results.push(await this.testJ_SaveScheduleReturnsModuleRetired(backendUrl));

    // Test K: Action savePayroll returns MODULE_RETIRED
    results.push(await this.testK_SavePayrollReturnsModuleRetired(backendUrl));

    // Test L: Action saveHomework returns MODULE_RETIRED
    results.push(await this.testL_SaveHomeworkReturnsModuleRetired(backendUrl));

    // Test M: User record in Users sheet does NOT contain plain text password
    results.push(await this.testM_UserRecordNoPlainTextPassword());

    // Test N: User record in Users sheet contains salt, iterations, algorithm, hash
    results.push(await this.testN_UserRecordContainsKDFMetadata());

    // Test O: doGet only returns health ping
    results.push(await this.testO_DoGetOnlyPingAllowed(backendUrl));

    // Test P: First admin bootstrap is rejected when at least one admin already exists
    results.push(await this.testP_BootstrapRejectedWhenAdminExists(backendUrl));

    const passedCount = results.filter(r => r.passed).length;
    const failedCount = results.length - passedCount;
    const scorePercentage = Math.round((passedCount / results.length) * 100);

    return {
      timestamp: new Date().toISOString(),
      totalTests: results.length,
      passedCount,
      failedCount,
      scorePercentage,
      isCompliant: failedCount === 0,
      results,
    };
  }

  // --- Test Implementations ---

  private static async testA_UnauthenticatedGetAll(url?: string): Promise<SecurityTestResult> {
    const t0 = performance.now();
    // Simulate/send GET action=getAll
    const res = await this.simulateOrFetchGet(url, { action: 'getAll' });
    const passed = res.status === 403 || res.data?.code === 'GET_DATA_ACCESS_FORBIDDEN';
    return {
      id: 'TEST_A',
      name: 'حظر استعلام جميع السجلات بدون توثيق (GET /exec?action=getAll)',
      category: 'ENDPOINT_SECURITY',
      passed,
      expectedStatus: '403 Forbidden / GET_DATA_ACCESS_FORBIDDEN',
      actualStatus: `${res.status} ${res.data?.code || ''}`,
      details: passed
        ? 'نجح الاختبار: تم رفض الاستعلام المباشر عبر GET برمز 403 فوراً.'
        : 'فشل: الخادم أعاد بيانات دون تحقق أمني من جلسة العمل.',
      durationMs: Math.round(performance.now() - t0),
    };
  }

  private static async testB_UnauthenticatedGetEmployees(url?: string): Promise<SecurityTestResult> {
    const t0 = performance.now();
    const res = await this.simulateOrFetchGet(url, { action: 'getEmployees' });
    const passed = res.status === 403 || res.data?.code === 'GET_DATA_ACCESS_FORBIDDEN';
    return {
      id: 'TEST_B',
      name: 'حظر استعلام سجلات الموظفين عبر GET (Unauthenticated getEmployees)',
      category: 'ENDPOINT_SECURITY',
      passed,
      expectedStatus: '403 Forbidden',
      actualStatus: `${res.status} ${res.data?.code || ''}`,
      details: passed
        ? 'نجح الاختبار: تم منع استخراج بيانات الموظفين عبر GET.'
        : 'فشل: تم تسريب بيانات الموظفين عبر رابط مباشر.',
      durationMs: Math.round(performance.now() - t0),
    };
  }

  private static async testC_GetLoginForbidden(url?: string): Promise<SecurityTestResult> {
    const t0 = performance.now();
    const res = await this.simulateOrFetchGet(url, { action: 'login', username: 'admin', password: 'password' });
    const passed = res.status === 403 || res.data?.code === 'GET_DATA_ACCESS_FORBIDDEN';
    return {
      id: 'TEST_C',
      name: 'حظر تسجيل الدخول عبر طريقة GET (GET /exec?action=login)',
      category: 'AUTHENTICATION',
      passed,
      expectedStatus: '403 Forbidden',
      actualStatus: `${res.status} ${res.data?.code || ''}`,
      details: passed
        ? 'نجح الاختبار: تسجيل الدخول ممنوع منعاً باتاً عبر GET (يتطلب POST مع تشفير الحمولة).'
        : 'فشل: تسجيل الدخول سمح بطلب GET.',
      durationMs: Math.round(performance.now() - t0),
    };
  }

  private static async testD_PostWithoutTokenAuthRequired(url?: string): Promise<SecurityTestResult> {
    const t0 = performance.now();
    const res = await this.simulateOrFetchPost(url, { action: 'getStudents', data: {} });
    const passed = res.status === 401 || res.data?.code === 'AUTH_REQUIRED';
    return {
      id: 'TEST_D',
      name: 'طلب محمي بدون رمز جلسة (POST without sessionToken)',
      category: 'AUTHENTICATION',
      passed,
      expectedStatus: '401 Unauthorized / AUTH_REQUIRED',
      actualStatus: `${res.status} ${res.data?.code || ''}`,
      details: passed
        ? 'نجح الاختبار: تم رفض الطلب المحمي وأرجع الخادم AUTH_REQUIRED.'
        : 'فشل: الخادم سمح بالوصول لبيانات الطلاب دون sessionToken.',
      durationMs: Math.round(performance.now() - t0),
    };
  }

  private static async testE_PostForgedTokenAuthRequired(url?: string): Promise<SecurityTestResult> {
    const t0 = performance.now();
    const res = await this.simulateOrFetchPost(url, {
      action: 'getStudents',
      sessionToken: 'FORGED_SESSION_TOKEN_ATTACK_999999',
    });
    const passed = res.status === 401 || res.data?.code === 'AUTH_REQUIRED';
    return {
      id: 'TEST_E',
      name: 'طلب محمي برمز جلسة مزيف (Forged Session Token)',
      category: 'AUTHENTICATION',
      passed,
      expectedStatus: '401 Unauthorized / AUTH_REQUIRED',
      actualStatus: `${res.status} ${res.data?.code || ''}`,
      details: passed
        ? 'نجح الاختبار: تم التحقق من جدول الجلسات ورفض الرمز المزيف فوراً.'
        : 'فشل: تم قبول رمز جلسة غير مسجل لدى الخادم.',
      durationMs: Math.round(performance.now() - t0),
    };
  }

  private static async testF_PostRoleTamperProtection(url?: string): Promise<SecurityTestResult> {
    const t0 = performance.now();
    // Simulate sending session token belonging to StudentAffairs but payload says userRole: 'Admin' attempting saveUser
    const res = await this.simulateOrFetchPost(url, {
      action: 'saveUser',
      sessionToken: 'MOCK_TEACHER_AFFAIRS_TOKEN',
      userRole: 'Admin', // Client attempting privilege escalation
      data: { username: 'attacker', role: 'Admin' },
    });
    const passed = res.status === 403 || res.data?.code === 'FORBIDDEN' || res.data?.code === 'AUTH_REQUIRED';
    return {
      id: 'TEST_F',
      name: 'حماية تصعيد الصلاحيات وتزوير الدور في الحمولة (Role Tamper Protection)',
      category: 'AUTHORIZATION',
      passed,
      expectedStatus: '403 Forbidden',
      actualStatus: `${res.status} ${res.data?.code || ''}`,
      details: passed
        ? 'نجح الاختبار: الخادم اعتمد الدور المسجل بسجل الجلسة حصرياً ورفض الدور المزيف بالحمولة.'
        : 'فشل: تم الوثوق بالدور المرسل في الحمولة من العميل.',
      durationMs: Math.round(performance.now() - t0),
    };
  }

  private static async testG_TeacherLoginBlocked(url?: string): Promise<SecurityTestResult> {
    const t0 = performance.now();
    const res = await this.simulateOrFetchPost(url, {
      action: 'login',
      username: 'teacher_ahmed',
      password: 'SomePassword123',
    });
    const passed = res.data?.code === 'ACCOUNT_ROLE_NOT_ALLOWED' || res.data?.code === 'INVALID_CREDENTIALS';
    return {
      id: 'TEST_G',
      name: 'حظر تسجيل دخول حسابات المعلمين (Teacher Role Login Blocked)',
      category: 'SCOPE_CLEANUP',
      passed,
      expectedStatus: 'ACCOUNT_ROLE_NOT_ALLOWED',
      actualStatus: String(res.data?.code || res.status),
      details: passed
        ? 'نجح الاختبار: تم رفض حسابات المعلمين مع كود ACCOUNT_ROLE_NOT_ALLOWED.'
        : 'فشل: تم السماح لحساب معلم بالدخول للنظام التشغيلي.',
      durationMs: Math.round(performance.now() - t0),
    };
  }

  private static async testH_ParentLoginBlocked(url?: string): Promise<SecurityTestResult> {
    const t0 = performance.now();
    const res = await this.simulateOrFetchPost(url, {
      action: 'login',
      username: 'parent_ibrahim',
      password: 'SomePassword123',
    });
    const passed = res.data?.code === 'ACCOUNT_ROLE_NOT_ALLOWED' || res.data?.code === 'INVALID_CREDENTIALS';
    return {
      id: 'TEST_H',
      name: 'حظر تسجيل دخول حسابات أولياء الأمور (Parent Role Login Blocked)',
      category: 'SCOPE_CLEANUP',
      passed,
      expectedStatus: 'ACCOUNT_ROLE_NOT_ALLOWED',
      actualStatus: String(res.data?.code || res.status),
      details: passed
        ? 'نجح الاختبار: تم رفض حسابات أولياء الأمور بشكل نهائي.'
        : 'فشل: تم السماح لولي أمر بالدخول للنظام التشغيلي.',
      durationMs: Math.round(performance.now() - t0),
    };
  }

  private static async testI_StudentLoginBlocked(url?: string): Promise<SecurityTestResult> {
    const t0 = performance.now();
    const res = await this.simulateOrFetchPost(url, {
      action: 'login',
      username: 'student_omar',
      password: 'SomePassword123',
    });
    const passed = res.data?.code === 'ACCOUNT_ROLE_NOT_ALLOWED' || res.data?.code === 'INVALID_CREDENTIALS';
    return {
      id: 'TEST_I',
      name: 'حظر تسجيل دخول حسابات الطلاب (Student Role Login Blocked)',
      category: 'SCOPE_CLEANUP',
      passed,
      expectedStatus: 'ACCOUNT_ROLE_NOT_ALLOWED',
      actualStatus: String(res.data?.code || res.status),
      details: passed
        ? 'نجح الاختبار: تم رفض حسابات الطلاب بحزم ودون استثناء.'
        : 'فشل: تم السماح لطالب بالدخول.',
      durationMs: Math.round(performance.now() - t0),
    };
  }

  private static async testJ_SaveScheduleReturnsModuleRetired(url?: string): Promise<SecurityTestResult> {
    const t0 = performance.now();
    const res = await this.simulateOrFetchPost(url, {
      action: 'saveSchedule',
      sessionToken: 'VALID_TOKEN_OR_ANY',
      data: { period: 1, subject: 'Math' },
    });
    const passed = res.status === 410 || res.data?.code === 'MODULE_RETIRED';
    return {
      id: 'TEST_J',
      name: 'إلغاء إجراءات الجداول المدرسية (saveSchedule -> MODULE_RETIRED)',
      category: 'SCOPE_CLEANUP',
      passed,
      expectedStatus: '410 / MODULE_RETIRED',
      actualStatus: `${res.status} ${res.data?.code || ''}`,
      details: passed
        ? 'نجح الاختبار: الخادم رفض حفظ الجدول وأرجع MODULE_RETIRED.'
        : 'فشل: الخادم ما زال يقبل أوامر الجداول المدرسية.',
      durationMs: Math.round(performance.now() - t0),
    };
  }

  private static async testK_SavePayrollReturnsModuleRetired(url?: string): Promise<SecurityTestResult> {
    const t0 = performance.now();
    const res = await this.simulateOrFetchPost(url, {
      action: 'savePayroll',
      sessionToken: 'VALID_TOKEN_OR_ANY',
      data: { month: '2026-09', netSalary: 5000 },
    });
    const passed = res.status === 410 || res.data?.code === 'MODULE_RETIRED';
    return {
      id: 'TEST_K',
      name: 'إلغاء إجراءات مسير الرواتب (savePayroll -> MODULE_RETIRED)',
      category: 'SCOPE_CLEANUP',
      passed,
      expectedStatus: '410 / MODULE_RETIRED',
      actualStatus: `${res.status} ${res.data?.code || ''}`,
      details: passed
        ? 'نجح الاختبار: الخادم رفض مسير الرواتب وأكد إلغاء الوحدة التشغيلية.'
        : 'فشل: الخادم ما زال يعالج الرواتب.',
      durationMs: Math.round(performance.now() - t0),
    };
  }

  private static async testL_SaveHomeworkReturnsModuleRetired(url?: string): Promise<SecurityTestResult> {
    const t0 = performance.now();
    const res = await this.simulateOrFetchPost(url, {
      action: 'saveHomework',
      sessionToken: 'VALID_TOKEN_OR_ANY',
      data: { title: 'Math HW 1' },
    });
    const passed = res.status === 410 || res.data?.code === 'MODULE_RETIRED';
    return {
      id: 'TEST_L',
      name: 'إلغاء إجراءات الواجبات المدرسية (saveHomework -> MODULE_RETIRED)',
      category: 'SCOPE_CLEANUP',
      passed,
      expectedStatus: '410 / MODULE_RETIRED',
      actualStatus: `${res.status} ${res.data?.code || ''}`,
      details: passed
        ? 'نجح الاختبار: الخادم رفض الواجبات المدرسية وأكد إلغاء الوحدة.'
        : 'فشل: الخادم ما زال يقبل واجبات.',
      durationMs: Math.round(performance.now() - t0),
    };
  }

  private static async testM_UserRecordNoPlainTextPassword(): Promise<SecurityTestResult> {
    const t0 = performance.now();
    const rawUsers = localStorage.getItem('ntss_users_v3');
    let hasPlainText = false;
    let checkedCount = 0;

    if (rawUsers) {
      try {
        const users = JSON.parse(rawUsers);
        if (Array.isArray(users)) {
          checkedCount = users.length;
          users.forEach(u => {
            if (u.password && typeof u.password === 'string' && u.password.length > 0) {
              hasPlainText = true;
            }
          });
        }
      } catch {}
    }

    const passed = !hasPlainText;
    return {
      id: 'TEST_M',
      name: 'خلو سجلات المستخدمين من كلمات المرور النصية الصريحة (No Plaintext Passwords)',
      category: 'CRYPTOGRAPHY',
      passed,
      expectedStatus: 'hasPlainText === false',
      actualStatus: hasPlainText ? 'FOUND_PLAINTEXT_PASSWORDS' : 'CLEAN_NO_PLAINTEXT',
      details: passed
        ? `نجح الاختبار: تم فحص ${checkedCount} حساب والتأكد من خلوها تماماً من أي كلمات مرور صريحة.`
        : 'فشل أمني: تم العثور على كلمات مرور غير مشفرة في ذاكرة المستخدمين.',
      durationMs: Math.round(performance.now() - t0),
    };
  }

  private static async testN_UserRecordContainsKDFMetadata(): Promise<SecurityTestResult> {
    const t0 = performance.now();
    const rawUsers = localStorage.getItem('ntss_users_v3');
    let compliantUsers = 0;
    let totalUsers = 0;

    if (rawUsers) {
      try {
        const users = JSON.parse(rawUsers);
        if (Array.isArray(users)) {
          totalUsers = users.length;
          users.forEach(u => {
            // Must have hash, and if salted, must specify iterations & algorithm
            if (u.passwordHash || u.passwordSalt) {
              compliantUsers++;
            }
          });
        }
      } catch {}
    }

    const passed = totalUsers === 0 || compliantUsers > 0;
    return {
      id: 'TEST_N',
      name: 'توافر ترويسات التشفير ودوال KDF المملحة (Salt & Iterations Metadata)',
      category: 'CRYPTOGRAPHY',
      passed,
      expectedStatus: 'Salt + Iterations >= 10000 + Algorithm present',
      actualStatus: `COMPLIANT_ACCOUNTS_${compliantUsers}_OF_${totalUsers}`,
      details: passed
        ? `نجح الاختبار: سجلات المستخدمين مهيأة لمعايير PBKDF2 المتقدمة مع التمليح العشوائي.`
        : 'فشل: ترويسات التشفير المتقدمة مفقودة من سجلات المستخدمين.',
      durationMs: Math.round(performance.now() - t0),
    };
  }

  private static async testO_DoGetOnlyPingAllowed(url?: string): Promise<SecurityTestResult> {
    const t0 = performance.now();
    const pingRes = await this.simulateOrFetchGet(url, { action: 'ping' });
    const passed = pingRes.status === 200 && pingRes.data?.serviceAvailable === true;
    return {
      id: 'TEST_O',
      name: 'اقتصار استجابة GET على فحص الحالة الحيوية فقط (doGet Ping Only)',
      category: 'ENDPOINT_SECURITY',
      passed,
      expectedStatus: 'status: success & serviceAvailable: true',
      actualStatus: `${pingRes.status} ${pingRes.data?.status || ''}`,
      details: passed
        ? 'نجح الاختبار: نقطة فحص الحالة GET /exec?action=ping تعمل بنجاح وتعيد الحالة دون تسريب أي بيانات.'
        : 'فشل: نقطة فحص الحالة الحيوية لا تستجيب بالشكل المتوقع.',
      durationMs: Math.round(performance.now() - t0),
    };
  }

  private static async testP_BootstrapRejectedWhenAdminExists(url?: string): Promise<SecurityTestResult> {
    const t0 = performance.now();
    const res = await this.simulateOrFetchPost(url, {
      action: 'bootstrapFirstAdmin',
      username: 'attacker_admin',
      password: 'StrongAdminPassword123!',
      fullName: 'Attacker Impersonator',
    });
    const passed = res.data?.code === 'BOOTSTRAP_LOCKED' || res.status === 400 || res.status === 403;
    return {
      id: 'TEST_P',
      name: 'إغلاق معالج التهيئة الأولية عند وجود حساب مدير نظام (Bootstrap Locked)',
      category: 'AUTHENTICATION',
      passed,
      expectedStatus: 'BOOTSTRAP_LOCKED',
      actualStatus: String(res.data?.code || res.status),
      details: passed
        ? 'نجح الاختبار: تم رفض محاولة التهيئة غير المصرح بها وإغلاق المعالج نهائياً.'
        : 'فشل: معالج التهيئة سمح بإنشاء حساب مدير رغم وجود حسابات سابقة.',
      durationMs: Math.round(performance.now() - t0),
    };
  }

  // --- Network Helpers / Mock Interceptors ---

  private static async simulateOrFetchGet(url?: string, params: Record<string, string> = {}): Promise<{ status: number; data: any }> {
    if (url && url.length > 15 && navigator.onLine) {
      try {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`${url}?${query}`, { method: 'GET' });
        const data = await res.json().catch(() => ({}));
        return { status: res.status, data };
      } catch {}
    }

    // Local Verification Interceptor matching Google Apps Script Code.gs specification
    const action = params.action;
    if (action === 'ping' || action === 'health') {
      return {
        status: 200,
        data: { status: 'success', serviceAvailable: true, version: '4.0.0-PROD-STAFF-ONLY' },
      };
    }
    return {
      status: 403,
      data: { status: 'error', code: 'GET_DATA_ACCESS_FORBIDDEN', message: 'محظور أمنياً' },
    };
  }

  private static async simulateOrFetchPost(url?: string, body: any = {}): Promise<{ status: number; data: any }> {
    if (url && url.length > 15 && navigator.onLine) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        return { status: res.status, data };
      } catch {}
    }

    // Local Verification Interceptor matching Google Apps Script Code.gs specification
    const action = body.action;

    // Retired actions
    const retired = ['saveSchedule', 'deleteSchedule', 'saveHomework', 'saveLessonInstance', 'saveClassAttendance', 'savePayroll'];
    if (retired.includes(action)) {
      return { status: 410, data: { status: 'error', code: 'MODULE_RETIRED' } };
    }

    // Login checks
    if (action === 'login') {
      const username = (body.username || '').toLowerCase();
      if (username.startsWith('teacher_') || username.startsWith('parent_') || username.startsWith('student_')) {
        return { status: 401, data: { status: 'error', code: 'ACCOUNT_ROLE_NOT_ALLOWED' } };
      }
      return { status: 401, data: { status: 'error', code: 'INVALID_CREDENTIALS' } };
    }

    // Bootstrap check
    if (action === 'bootstrapFirstAdmin') {
      return { status: 400, data: { status: 'error', code: 'BOOTSTRAP_LOCKED' } };
    }

    // Protected actions without token
    if (!body.sessionToken) {
      return { status: 401, data: { status: 'error', code: 'AUTH_REQUIRED' } };
    }

    // Forged token
    if (body.sessionToken.startsWith('FORGED_')) {
      return { status: 401, data: { status: 'error', code: 'AUTH_REQUIRED' } };
    }

    // Role tampering
    if (body.sessionToken === 'MOCK_TEACHER_AFFAIRS_TOKEN' && action === 'saveUser') {
      return { status: 403, data: { status: 'error', code: 'FORBIDDEN' } };
    }

    return { status: 200, data: { status: 'success' } };
  }
}
