/**
 * ==============================================================================
 * NTSS STAFF-ONLY SCHOOL ERP - CANONICAL BACKEND API
 * خادم المعالجة وقاعدة البيانات المعتمد لنظام المدارس الوطنية للعلوم التقنية
 * ==============================================================================
 * 
 * CANONICAL_BACKEND_SOURCE: google-apps-script/Code.gs
 * CANONICAL_BACKEND_VERSION: 4.0.0-PROD-STAFF-ONLY
 * ARCHITECTURE: Production Hardened | Session-Authenticated | Role-Authorized
 * SCOPE: Staff-Only Operations (Students, Daily Attendance, Behavior, HR Staff, Leaves)
 * RETIRED: SAMAT, Payroll, Schedule/Timetable, Homework, Class-Period Attendance, Portals
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Open Google Sheet -> Extensions -> Apps Script.
 * 2. Replace all script code with this canonical file.
 * 3. Deploy -> Manage deployments -> Edit -> New version -> Deploy.
 * 4. Ensure Execute as: "Me" and Access: "Anyone".
 */

var CANONICAL_BACKEND_SOURCE = 'google-apps-script/Code.gs';
var CANONICAL_BACKEND_VERSION = '4.0.0-PROD-STAFF-ONLY';
var PBKDF2_ITERATIONS = 10000;
var SESSION_DURATION_HOURS = 24;

// Active and Canonical Sheets
var SHEETS = {
  USERS: 'Users',
  SESSIONS: 'Sessions',
  EMPLOYEES: 'Employees',
  ATTENDANCE: 'Attendance',
  LEAVES: 'Leaves',
  PERMISSIONS: 'Permissions',
  SETTINGS: 'Settings',
  AUDIT_LOGS: 'Audit_Logs',
  STUDENTS: 'Students',
  STUDENT_ATTENDANCE: 'Student_Attendance',
  BEHAVIOR_VIOLATIONS: 'Behavior_Violations',
  BEHAVIOR_CASES: 'Behavior_Cases',
  POSITIVE_BEHAVIOR_TYPES: 'Positive_Behavior_Types',
  ACADEMIC_YEARS: 'Academic_Years',
  STUDENT_ENROLLMENTS: 'Student_Enrollments',
  PARENT_COMMUNICATIONS: 'Parent_Communications',
  LOCATIONS: 'Locations',
  ARCHIVE_METRICS: 'Archive_Metrics'
};

// Retired Modules List (Strictly forbidden from execution)
var RETIRED_ACTIONS = [
  'saveSchedule',
  'deleteSchedule',
  'bulkSaveSchedule',
  'getSchedule',
  'saveHomework',
  'deleteHomework',
  'getHomework',
  'saveLessonInstance',
  'deleteLessonInstance',
  'saveClassAttendance',
  'bulkSaveClassAttendance',
  'getClassAttendance',
  'savePayroll',
  'bulkSavePayroll',
  'deletePayroll',
  'generatePayroll',
  'getPayroll'
];

/**
 * Handle GET Requests - STRICT SECURITY GATEWAY
 * NOTE: Unauthenticated data access via GET is permanently forbidden.
 * doGet only allows a minimal health ping.
 */
function doGet(e) {
  var params = e ? e.parameter : {};
  var action = params.action || '';
  var requestId = 'REQ_' + Utilities.getUuid().substring(0, 8);

  // Strictly permit ONLY health ping
  if (action === 'ping' || action === 'health') {
    var output = {
      status: 'success',
      serviceAvailable: true,
      canonicalSource: CANONICAL_BACKEND_SOURCE,
      version: CANONICAL_BACKEND_VERSION,
      systemMode: 'STAFF_ONLY_ERP',
      timestamp: new Date().toISOString(),
      serverTime: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'),
      requestId: requestId,
      securityPolicy: 'POST_ONLY_AUTHENTICATED_SESSIONS'
    };
    return createJsonResponse(output, 200);
  }

  // Reject ANY other GET action (including getAll, getEmployees, login, etc.)
  var errorOutput = {
    status: 'error',
    code: 'GET_DATA_ACCESS_FORBIDDEN',
    message: 'الوصول المباشر للبيانات عبر GET محظور أمنياً. يتطلب النظام طلبات POST موثقة بجلسة عمل نشطة.',
    requestId: requestId,
    timestamp: new Date().toISOString()
  };
  return createJsonResponse(errorOutput, 403);
}

/**
 * Handle POST Requests - AUTHENTICATED & AUTHORIZED GATEWAY
 */
function doPost(e) {
  var requestId = 'POST_' + Utilities.getUuid().substring(0, 8);
  var output = {
    status: 'success',
    timestamp: new Date().toISOString(),
    requestId: requestId,
    version: CANONICAL_BACKEND_VERSION
  };

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    initSheetsIfMissing(ss);

    var postData = {};
    if (e && e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        return createJsonResponse({
          status: 'error',
          code: 'INVALID_JSON_PAYLOAD',
          message: 'فشل تحليل حمولة البيانات (JSON غير صالح)',
          requestId: requestId
        }, 400);
      }
    }

    var action = postData.action || '';
    var payload = postData.data;

    // -------------------------------------------------------------
    // 1. PUBLIC ACTIONS (No sessionToken required)
    // -------------------------------------------------------------
    if (action === 'ping') {
      output.serviceAvailable = true;
      output.message = 'Backend is active and secure';
      return createJsonResponse(output, 200);
    }

    if (action === 'login') {
      var username = String(postData.username || (payload && payload.username) || '').trim().toLowerCase();
      var password = String(postData.password || (payload && payload.password) || '').trim();

      var authResult = handleStaffLogin(ss, username, password, requestId);
      if (!authResult.success) {
        return createJsonResponse({
          status: 'error',
          code: authResult.code || 'AUTH_FAILED',
          message: authResult.message,
          requestId: requestId
        }, 401);
      }

      output.message = 'تم تسجيل الدخول وإنشاء جلسة عمل معتمدة بنجاح';
      output.sessionToken = authResult.sessionToken;
      output.expiresAt = authResult.expiresAt;
      output.user = authResult.user;
      return createJsonResponse(output, 200);
    }

    if (action === 'bootstrapFirstAdmin') {
      var bootstrapResult = handleFirstAdminBootstrap(ss, postData, requestId);
      if (!bootstrapResult.success) {
        return createJsonResponse({
          status: 'error',
          code: bootstrapResult.code || 'BOOTSTRAP_FAILED',
          message: bootstrapResult.message,
          requestId: requestId
        }, 400);
      }

      output.message = bootstrapResult.message;
      output.user = bootstrapResult.user;
      return createJsonResponse(output, 200);
    }

    // -------------------------------------------------------------
    // 2. RETIRED MODULE CHECK
    // -------------------------------------------------------------
    if (RETIRED_ACTIONS.indexOf(action) !== -1) {
      return createJsonResponse({
        status: 'error',
        code: 'MODULE_RETIRED',
        message: 'تم إلغاء هذه الوحدة (الجداول المدرسية / مسير الرواتب / الواجبات / حضور الحصص) نهائياً من النظام التشغيلي.',
        requestId: requestId
      }, 410);
    }

    // -------------------------------------------------------------
    // 3. SESSION AUTHENTICATION GATE (For all protected actions)
    // -------------------------------------------------------------
    var incomingToken = postData.sessionToken || (payload && payload.sessionToken) || '';
    if (!incomingToken) {
      return createJsonResponse({
        status: 'error',
        code: 'AUTH_REQUIRED',
        message: 'مطلوب رمز جلسة عمل نشط ومعتمد (sessionToken) لتنفيذ هذا الإجراء',
        requestId: requestId
      }, 401);
    }

    var sessionAuth = validateSessionToken(ss, incomingToken);
    if (!sessionAuth.valid) {
      return createJsonResponse({
        status: 'error',
        code: sessionAuth.code || 'AUTH_REQUIRED',
        message: sessionAuth.message,
        requestId: requestId
      }, 401);
    }

    var activeSession = sessionAuth.session;
    // CRITICAL: User ID and Role are resolved strictly from the server-side session
    var authenticatedUserId = activeSession.userId;
    var authenticatedRole = activeSession.role;
    var authenticatedUsername = activeSession.username;

    // -------------------------------------------------------------
    // 4. CENTRAL ROLE-BASED AUTHORIZATION GATE
    // -------------------------------------------------------------
    var authzResult = authorizeStaffAction(authenticatedRole, action);
    if (!authzResult.allowed) {
      return createJsonResponse({
        status: 'error',
        code: 'FORBIDDEN',
        message: authzResult.message || 'ليس لديك الصلاحيات الإدارية الكافية لتنفيذ هذا الإجراء',
        userRole: authenticatedRole,
        action: action,
        requestId: requestId
      }, 403);
    }

    // -------------------------------------------------------------
    // 5. PROTECTED ACTION HANDLERS
    // -------------------------------------------------------------

    // A. Session Lifecycle
    if (action === 'logout') {
      revokeSessionToken(ss, incomingToken);
      output.message = 'تم إنهاء جلسة العمل وإلغاؤها بنجاح';
      return createJsonResponse(output, 200);
    }

    if (action === 'validateSession') {
      output.valid = true;
      output.user = {
        id: authenticatedUserId,
        username: authenticatedUsername,
        role: authenticatedRole,
        fullName: activeSession.fullName
      };
      output.expiresAt = activeSession.expiresAt;
      return createJsonResponse(output, 200);
    }

    // B. Students Management
    if (action === 'getStudents') {
      output.data = getSheetData(ss, SHEETS.STUDENTS);
      return createJsonResponse(output, 200);
    }

    if (action === 'saveStudent' && payload) {
      upsertRecord(ss, SHEETS.STUDENTS, 'id', payload);
      recordAuthoritativeAudit(ss, requestId, authenticatedUsername, authenticatedRole, 'SAVE', 'STUDENTS', payload.id || '', 'حفظ سجل طالب');
      output.message = 'تم حفظ بيانات الطالب بنجاح';
      return createJsonResponse(output, 200);
    }

    if (action === 'deleteStudent' && payload && payload.id) {
      deleteRecord(ss, SHEETS.STUDENTS, 'id', payload.id);
      recordAuthoritativeAudit(ss, requestId, authenticatedUsername, authenticatedRole, 'DELETE', 'STUDENTS', payload.id, 'حذف سجل طالب');
      output.message = 'تم حذف سجل الطالب بنجاح';
      return createJsonResponse(output, 200);
    }

    if (action === 'bulkSaveStudents' && payload && Array.isArray(payload)) {
      payload.forEach(function(rec) { upsertRecord(ss, SHEETS.STUDENTS, 'id', rec); });
      recordAuthoritativeAudit(ss, requestId, authenticatedUsername, authenticatedRole, 'BULK_SAVE', 'STUDENTS', payload.length + ' records', 'حفظ دفعة طلاب');
      output.message = 'تم حفظ ' + payload.length + ' سجل طالب بنجاح';
      return createJsonResponse(output, 200);
    }

    // C. Daily Student Attendance
    if (action === 'getStudentAttendance') {
      output.data = getSheetData(ss, SHEETS.STUDENT_ATTENDANCE);
      return createJsonResponse(output, 200);
    }

    if (action === 'saveStudentAttendance' && payload) {
      upsertRecord(ss, SHEETS.STUDENT_ATTENDANCE, 'id', payload);
      recordAuthoritativeAudit(ss, requestId, authenticatedUsername, authenticatedRole, 'SAVE', 'STUDENT_ATTENDANCE', payload.id || '', 'تسجيل حضور طالب');
      output.message = 'تم تسجيل حضور الطالب بنجاح';
      return createJsonResponse(output, 200);
    }

    if (action === 'bulkSaveStudentAttendance' && payload && Array.isArray(payload)) {
      payload.forEach(function(rec) { upsertRecord(ss, SHEETS.STUDENT_ATTENDANCE, 'id', rec); });
      output.message = 'تم حفظ دفعة حضور الطلاب بنجاح (' + payload.length + ' سجل)';
      return createJsonResponse(output, 200);
    }

    // D. Staff & Employees (Financial fields strictly stripped)
    if (action === 'getEmployees') {
      var rawEmployees = getSheetData(ss, SHEETS.EMPLOYEES);
      // Strip any salary / allowances columns for staff privacy and payroll retirement
      output.data = rawEmployees.map(function(emp) {
        var cleanEmp = Object.assign({}, emp);
        delete cleanEmp.basicSalary;
        delete cleanEmp.allowances;
        delete cleanEmp.netSalary;
        return cleanEmp;
      });
      return createJsonResponse(output, 200);
    }

    if (action === 'saveEmployee' && payload) {
      var sanitizedEmp = Object.assign({}, payload);
      delete sanitizedEmp.basicSalary;
      delete sanitizedEmp.allowances;
      upsertRecord(ss, SHEETS.EMPLOYEES, 'id', sanitizedEmp);
      recordAuthoritativeAudit(ss, requestId, authenticatedUsername, authenticatedRole, 'SAVE', 'EMPLOYEES', payload.id || '', 'حفظ سجل موظف');
      output.message = 'تم حفظ بيانات الموظف بنجاح';
      return createJsonResponse(output, 200);
    }

    if (action === 'deleteEmployee' && payload && payload.id) {
      deleteRecord(ss, SHEETS.EMPLOYEES, 'id', payload.id);
      recordAuthoritativeAudit(ss, requestId, authenticatedUsername, authenticatedRole, 'DELETE', 'EMPLOYEES', payload.id, 'حذف موظف');
      output.message = 'تم حذف سجل الموظف بنجاح';
      return createJsonResponse(output, 200);
    }

    // E. Employee Attendance, Leaves, Permissions
    if (action === 'getAttendance') {
      output.data = getSheetData(ss, SHEETS.ATTENDANCE);
      return createJsonResponse(output, 200);
    }

    if (action === 'saveAttendance' && payload) {
      upsertRecord(ss, SHEETS.ATTENDANCE, 'id', payload);
      recordAuthoritativeAudit(ss, requestId, authenticatedUsername, authenticatedRole, 'SAVE', 'ATTENDANCE', payload.id || '', 'تسجيل دوام موظف');
      output.message = 'تم تسجيل دوام الموظف بنجاح';
      return createJsonResponse(output, 200);
    }

    if (action === 'bulkSaveAttendance' && payload && Array.isArray(payload)) {
      payload.forEach(function(rec) { upsertRecord(ss, SHEETS.ATTENDANCE, 'id', rec); });
      output.message = 'تم حفظ دوام الموظفين (' + payload.length + ' سجل)';
      return createJsonResponse(output, 200);
    }

    if (action === 'getLeaves') {
      output.data = getSheetData(ss, SHEETS.LEAVES);
      return createJsonResponse(output, 200);
    }

    if (action === 'saveLeave' && payload) {
      upsertRecord(ss, SHEETS.LEAVES, 'id', payload);
      recordAuthoritativeAudit(ss, requestId, authenticatedUsername, authenticatedRole, 'SAVE', 'LEAVES', payload.id || '', 'طلب / اعتماد إجازة');
      output.message = 'تم حفظ سجل الإجازة بنجاح';
      return createJsonResponse(output, 200);
    }

    if (action === 'deleteLeave' && payload && payload.id) {
      deleteRecord(ss, SHEETS.LEAVES, 'id', payload.id);
      output.message = 'تم حذف سجل الإجازة بنجاح';
      return createJsonResponse(output, 200);
    }

    if (action === 'getPermissions') {
      output.data = getSheetData(ss, SHEETS.PERMISSIONS);
      return createJsonResponse(output, 200);
    }

    if (action === 'savePermission' && payload) {
      upsertRecord(ss, SHEETS.PERMISSIONS, 'id', payload);
      recordAuthoritativeAudit(ss, requestId, authenticatedUsername, authenticatedRole, 'SAVE', 'PERMISSIONS', payload.id || '', 'طلب / اعتماد إذن دوام');
      output.message = 'تم حفظ سجل الإذن بنجاح';
      return createJsonResponse(output, 200);
    }

    if (action === 'deletePermission' && payload && payload.id) {
      deleteRecord(ss, SHEETS.PERMISSIONS, 'id', payload.id);
      output.message = 'تم حذف سجل الإذن بنجاح';
      return createJsonResponse(output, 200);
    }

    // F. Behavior & Social Support
    if (action === 'getBehaviorRecords') {
      output.violations = getSheetData(ss, SHEETS.BEHAVIOR_VIOLATIONS);
      output.cases = getSheetData(ss, SHEETS.BEHAVIOR_CASES);
      output.positiveTypes = getSheetData(ss, SHEETS.POSITIVE_BEHAVIOR_TYPES);
      return createJsonResponse(output, 200);
    }

    if (action === 'saveBehaviorViolation' && payload) {
      upsertRecord(ss, SHEETS.BEHAVIOR_VIOLATIONS, 'id', payload);
      recordAuthoritativeAudit(ss, requestId, authenticatedUsername, authenticatedRole, 'SAVE', 'BEHAVIOR', payload.id || '', 'رصد مخالفة سلوكية');
      output.message = 'تم تسجيل المخالفة السلوكية بنجاح';
      return createJsonResponse(output, 200);
    }

    if (action === 'saveBehaviorCase' && payload) {
      upsertRecord(ss, SHEETS.BEHAVIOR_CASES, 'id', payload);
      recordAuthoritativeAudit(ss, requestId, authenticatedUsername, authenticatedRole, 'SAVE', 'BEHAVIOR_CASES', payload.id || '', 'فتح / تعديل حالة رعاية اجتماعية');
      output.message = 'تم حفظ دراسة الحالة بنجاح';
      return createJsonResponse(output, 200);
    }

    // G. Academic Years & Enrollments
    if (action === 'getAcademicYears') {
      output.academicYears = getSheetData(ss, SHEETS.ACADEMIC_YEARS);
      output.enrollments = getSheetData(ss, SHEETS.STUDENT_ENROLLMENTS);
      return createJsonResponse(output, 200);
    }

    if (action === 'saveAcademicYear' && payload) {
      upsertRecord(ss, SHEETS.ACADEMIC_YEARS, 'id', payload);
      recordAuthoritativeAudit(ss, requestId, authenticatedUsername, authenticatedRole, 'SAVE', 'ACADEMIC_YEARS', payload.id || '', 'حفظ عام دراسي');
      output.message = 'تم حفظ العام الدراسي بنجاح';
      return createJsonResponse(output, 200);
    }

    if (action === 'saveStudentEnrollment' && payload) {
      upsertRecord(ss, SHEETS.STUDENT_ENROLLMENTS, 'id', payload);
      output.message = 'تم حفظ قيد الطالب بنجاح';
      return createJsonResponse(output, 200);
    }

    // H. Parent Communications (Staff-Recorded Logs)
    if (action === 'getParentCommunications') {
      output.data = getSheetData(ss, SHEETS.PARENT_COMMUNICATIONS);
      return createJsonResponse(output, 200);
    }

    if (action === 'saveParentCommunication' && payload) {
      upsertRecord(ss, SHEETS.PARENT_COMMUNICATIONS, 'id', payload);
      recordAuthoritativeAudit(ss, requestId, authenticatedUsername, authenticatedRole, 'SAVE', 'PARENT_COMM', payload.id || '', 'تسجيل تواصل مع ولي الأمر');
      output.message = 'تم تسجيل محضر التواصل بنجاح';
      return createJsonResponse(output, 200);
    }

    // I. School Settings (Stripped of payroll/schedule configs)
    if (action === 'getSettings') {
      output.data = getSettingsDataClean(ss);
      return createJsonResponse(output, 200);
    }

    if (action === 'saveSettings' && payload) {
      saveSettingsDataClean(ss, payload);
      recordAuthoritativeAudit(ss, requestId, authenticatedUsername, authenticatedRole, 'SAVE', 'SETTINGS', 'CONFIG', 'تحديث إعدادات وسياسات المدرسة');
      output.message = 'تم حفظ إعدادات المدرسة بنجاح';
      return createJsonResponse(output, 200);
    }

    // J. User Administration (Admin Only)
    if (action === 'getUsers') {
      output.data = getSanitizedUsersList(ss);
      return createJsonResponse(output, 200);
    }

    if (action === 'saveUser' && payload) {
      var savedUser = saveUserSecure(ss, payload, authenticatedUsername, requestId);
      recordAuthoritativeAudit(ss, requestId, authenticatedUsername, authenticatedRole, 'SAVE', 'USERS', payload.username || '', 'حفظ حساب مستخدم');
      output.message = 'تم حفظ حساب المستخدم بنجاح';
      output.user = savedUser;
      return createJsonResponse(output, 200);
    }

    if (action === 'deleteUser' && payload && payload.id) {
      deleteRecord(ss, SHEETS.USERS, 'id', payload.id);
      recordAuthoritativeAudit(ss, requestId, authenticatedUsername, authenticatedRole, 'DELETE', 'USERS', payload.id, 'حذف حساب مستخدم');
      output.message = 'تم حذف حساب المستخدم بنجاح';
      return createJsonResponse(output, 200);
    }

    // K. Audit Logs
    if (action === 'getAuditLogs') {
      output.data = getSheetData(ss, SHEETS.AUDIT_LOGS);
      return createJsonResponse(output, 200);
    }

    if (action === 'addAuditLog' && payload) {
      recordAuthoritativeAudit(ss, requestId, authenticatedUsername, authenticatedRole, payload.action || 'CUSTOM', payload.entity || 'SYSTEM', payload.targetId || '', payload.details || '');
      output.message = 'تم قيد العملية في سجل الرقابة';
      return createJsonResponse(output, 200);
    }

    // L. Server-Side Archive & Scope Snapshot (Admin Only)
    if (action === 'createArchiveSnapshot') {
      var archiveReceipt = executeServerSideArchive(ss, authenticatedUsername, requestId);
      output.message = 'تم أرشفة وتجميد الجداول الملغاة وحفظ إيصال الأرشفة بنجاح';
      output.archiveReceipt = archiveReceipt;
      return createJsonResponse(output, 200);
    }

    // Unknown action
    return createJsonResponse({
      status: 'error',
      code: 'UNKNOWN_ACTION',
      message: 'الإجراء المطلوب غير معروف أو تم إيقافه: ' + action,
      requestId: requestId
    }, 404);

  } catch (err) {
    return createJsonResponse({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: err.toString(),
      requestId: requestId
    }, 500);
  }
}

// -------------------------------------------------------------
// CORE AUTHENTICATION & SECURITY IMPLEMENTATION
// -------------------------------------------------------------

/**
 * Handle staff login with salted PBKDF2/HMAC verification
 */
function handleStaffLogin(ss, inputUsername, inputPassword, requestId) {
  if (!inputUsername || !inputPassword) {
    return { success: false, code: 'CREDENTIALS_REQUIRED', message: 'يرجى إدخال اسم المستخدم وكلمة المرور' };
  }

  var users = getSheetData(ss, SHEETS.USERS);
  if (!users || users.length === 0) {
    return {
      success: false,
      code: 'DATABASE_EMPTY',
      message: 'قاعدة بيانات المستخدمين فارغة. يرجى تهيئة حساب المدير الأول عبر معالج التهيئة الآمن.'
    };
  }

  var matchedUser = null;
  var userRowIndex = -1;

  for (var i = 0; i < users.length; i++) {
    var u = users[i];
    var uName = String(u.username || '').trim().toLowerCase();
    var uId = String(u.id || '').trim().toLowerCase();
    if (uName === inputUsername || uId === inputUsername) {
      matchedUser = u;
      userRowIndex = i + 2; // +2 for header offset
      break;
    }
  }

  if (!matchedUser) {
    return { success: false, code: 'INVALID_CREDENTIALS', message: 'اسم المستخدم أو كلمة المرور غير صحيحة.' };
  }

  // 1. Permanent Staff-Only Role Enforcement: Block Teacher, Parent, Student
  var role = String(matchedUser.role || '').trim();
  if (role === 'Teacher' || role === 'Parent' || role === 'Student') {
    recordAuthoritativeAudit(ss, requestId, inputUsername, role, 'LOGIN_BLOCKED', 'AUTH', matchedUser.id || '', 'محاولة دخول بحساب دور ملغى (' + role + ')');
    return {
      success: false,
      code: 'ACCOUNT_ROLE_NOT_ALLOWED',
      message: 'حسابات المعلمين وأولياء الأمور والطلاب ملغاة من النظام التشغيلي. الدخول مخصص لموظفي الإدارة المعتمدين فقط.'
    };
  }

  // 2. Account Status Check
  var status = String(matchedUser.status || 'Active').trim().toLowerCase();
  var isActive = (matchedUser.isActive === true || matchedUser.isActive === 'true' || matchedUser.isActive === undefined);
  if (status === 'inactive' || status === 'disabled' || !isActive) {
    return { success: false, code: 'ACCOUNT_INACTIVE', message: 'هذا الحساب غير مفعل حالياً. يرجى مراجعة مدير النظام.' };
  }

  // 3. Salted Password Verification
  var storedHash = String(matchedUser.passwordHash || matchedUser.password || '').trim();
  var storedSalt = String(matchedUser.passwordSalt || '').trim();
  var storedIter = parseInt(matchedUser.passwordIterations || '10000', 10);
  var passwordValid = false;

  if (storedSalt) {
    // Salted PBKDF2/HMAC check
    var computedHash = computeSaltedHash(inputPassword, storedSalt, storedIter);
    passwordValid = (computedHash === storedHash);
  } else {
    // Legacy SHA-256 hash upgrade path (Never match plain text)
    var inputSha256 = hashStringSHA256(inputPassword);
    if (storedHash === inputSha256) {
      passwordValid = true;
      // Upgrade user record immediately to salted PBKDF2
      try {
        var newSalt = Utilities.getUuid().replace(/-/g, '');
        var newHash = computeSaltedHash(inputPassword, newSalt, PBKDF2_ITERATIONS);
        updateUserPasswordColumns(ss, userRowIndex, newHash, newSalt, 'PBKDF2-HMAC-SHA256', PBKDF2_ITERATIONS);
      } catch (upgradeErr) {}
    }
  }

  if (!passwordValid) {
    recordAuthoritativeAudit(ss, requestId, inputUsername, role, 'LOGIN_FAILED', 'AUTH', matchedUser.id || '', 'كلمة مرور خاطئة');
    return { success: false, code: 'INVALID_CREDENTIALS', message: 'اسم المستخدم أو كلمة المرور غير صحيحة.' };
  }

  // 4. Generate Server-Authoritative Opaque Session Token
  var sessionToken = Utilities.getUuid() + '-' + Utilities.getUuid();
  var tokenHash = hashStringSHA256(sessionToken);
  var now = new Date();
  var expiresAt = new Date(now.getTime() + (SESSION_DURATION_HOURS * 60 * 60 * 1000));
  var nowStr = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
  var expiresStr = Utilities.formatDate(expiresAt, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');

  // Record session in Sessions sheet
  var sessionId = 'SESS_' + Utilities.getUuid().substring(0, 10);
  var sessionRow = [
    sessionId,
    tokenHash,
    String(matchedUser.id || ''),
    String(matchedUser.username || inputUsername),
    String(matchedUser.fullName || 'موظف معتمد'),
    role,
    nowStr,
    expiresStr,
    'ACTIVE'
  ];

  var sessionsSheet = ss.getSheetByName(SHEETS.SESSIONS);
  if (sessionsSheet) {
    sessionsSheet.appendRow(sessionRow);
  }

  // Update lastLogin in Users sheet
  try {
    var usersSheet = ss.getSheetByName(SHEETS.USERS);
    var headers = usersSheet.getRange(1, 1, 1, usersSheet.getLastColumn()).getValues()[0];
    var lastLoginCol = headers.indexOf('lastLogin') + 1;
    if (lastLoginCol > 0 && userRowIndex > 0) {
      usersSheet.getRange(userRowIndex, lastLoginCol).setValue(nowStr);
    }
  } catch (e) {}

  recordAuthoritativeAudit(ss, requestId, inputUsername, role, 'LOGIN_SUCCESS', 'AUTH', matchedUser.id || '', 'تسجيل دخول ناجح وإنشاء جلسة');

  var sanitizedUser = {
    id: String(matchedUser.id || ''),
    username: String(matchedUser.username || inputUsername),
    fullName: String(matchedUser.fullName || 'موظف النظام'),
    role: role,
    status: 'Active',
    department: String(matchedUser.department || ''),
    lastLogin: now.toISOString()
  };

  return {
    success: true,
    sessionToken: sessionToken,
    expiresAt: expiresAt.toISOString(),
    user: sanitizedUser
  };
}

/**
 * Handle First Admin Bootstrap (Permitted ONLY once when Users table has 0 users)
 */
function handleFirstAdminBootstrap(ss, postData, requestId) {
  var users = getSheetData(ss, SHEETS.USERS);
  var activeAdmins = users.filter(function(u) {
    return String(u.role || '').trim() === 'Admin' && String(u.status || 'Active').trim() === 'Active';
  });

  // Permanently reject if an admin already exists or property is set
  var propCompleted = PropertiesService.getScriptProperties().getProperty('BOOTSTRAP_COMPLETED');
  if (activeAdmins.length > 0 || propCompleted === 'true') {
    return {
      success: false,
      code: 'BOOTSTRAP_LOCKED',
      message: 'تم إغلاق معالج التهيئة الأولية نهائياً. يوجد بالفعل حساب مدير نظام معتمد.'
    };
  }

  var username = String(postData.username || 'admin').trim().toLowerCase();
  var password = String(postData.password || '').trim();
  var fullName = String(postData.fullName || 'مدير النظام الأول').trim();
  var email = String(postData.email || 'admin@school.edu.eg').trim();

  if (!password || password.length < 8) {
    return {
      success: false,
      code: 'WEAK_PASSWORD',
      message: 'يجب أن لا تقل كلمة مرور المدير الأول عن 8 أحرف وأرقام معاً لحماية النظام.'
    };
  }

  var salt = Utilities.getUuid().replace(/-/g, '');
  var hash = computeSaltedHash(password, salt, PBKDF2_ITERATIONS);
  var nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');

  var newAdminRow = {
    id: 'USR-ADMIN-001',
    username: username,
    passwordHash: hash,
    passwordSalt: salt,
    passwordAlgorithm: 'PBKDF2-HMAC-SHA256',
    passwordIterations: PBKDF2_ITERATIONS,
    fullName: fullName,
    role: 'Admin',
    status: 'Active',
    department: 'الإدارة العامة',
    email: email,
    createdAt: nowStr,
    lastLogin: ''
  };

  upsertRecord(ss, SHEETS.USERS, 'username', newAdminRow);

  // Permanently lock bootstrap
  PropertiesService.getScriptProperties().setProperty('BOOTSTRAP_COMPLETED', 'true');
  recordAuthoritativeAudit(ss, requestId, username, 'Admin', 'BOOTSTRAP_FIRST_ADMIN', 'SYSTEM', 'USR-ADMIN-001', 'تهيئة حساب مدير النظام الأول وإغلاق المعالج نهائياً');

  return {
    success: true,
    message: 'تم تهيئة حساب مدير النظام الأول بنجاح وإغلاق معالج التهيئة بشكل دائم.',
    user: {
      id: newAdminRow.id,
      username: newAdminRow.username,
      fullName: newAdminRow.fullName,
      role: 'Admin',
      status: 'Active'
    }
  };
}

/**
 * Validate incoming session token from Sessions sheet
 */
function validateSessionToken(ss, token) {
  if (!token) return { valid: false, code: 'AUTH_REQUIRED', message: 'رمز جلسة العمل مفقود' };

  var tokenHash = hashStringSHA256(token);
  var sessions = getSheetData(ss, SHEETS.SESSIONS);
  var matched = null;
  var rowIndex = -1;

  for (var i = sessions.length - 1; i >= 0; i--) {
    if (sessions[i].tokenHash === tokenHash) {
      matched = sessions[i];
      rowIndex = i + 2;
      break;
    }
  }

  if (!matched || matched.status !== 'ACTIVE') {
    return { valid: false, code: 'AUTH_REQUIRED', message: 'جلسة العمل غير صالحة أو تم إبطالها' };
  }

  var expiresAtDate = new Date(matched.expiresAt);
  if (isNaN(expiresAtDate.getTime()) || new Date() > expiresAtDate) {
    try {
      var sheet = ss.getSheetByName(SHEETS.SESSIONS);
      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      var statusCol = headers.indexOf('status') + 1;
      if (statusCol > 0 && rowIndex > 0) {
        sheet.getRange(rowIndex, statusCol).setValue('EXPIRED');
      }
    } catch (e) {}
    return { valid: false, code: 'SESSION_EXPIRED', message: 'انتهت صلاحية جلسة العمل. يرجى تسجيل الدخول مجدداً.' };
  }

  return {
    valid: true,
    session: {
      sessionId: matched.sessionId,
      userId: String(matched.userId || ''),
      username: String(matched.username || ''),
      fullName: String(matched.fullName || ''),
      role: String(matched.role || 'TeacherAffairs'),
      expiresAt: matched.expiresAt
    }
  };
}

/**
 * Revoke session token
 */
function revokeSessionToken(ss, token) {
  var tokenHash = hashStringSHA256(token);
  var sheet = ss.getSheetByName(SHEETS.SESSIONS);
  if (!sheet) return;

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;
  var headers = data[0];
  var tokenHashCol = headers.indexOf('tokenHash');
  var statusCol = headers.indexOf('status');

  if (tokenHashCol < 0 || statusCol < 0) return;

  for (var i = 1; i < data.length; i++) {
    if (data[i][tokenHashCol] === tokenHash) {
      sheet.getRange(i + 1, statusCol + 1).setValue('REVOKED');
      break;
    }
  }
}

/**
 * Authorize Action based on Staff Role
 */
function authorizeStaffAction(role, action) {
  // Admin has access to all active actions
  if (role === 'Admin') return { allowed: true };

  // School Director
  if (role === 'SchoolDirector') {
    var forbiddenForDirector = ['saveUser', 'deleteUser'];
    if (forbiddenForDirector.indexOf(action) !== -1) {
      return { allowed: false, message: 'إدارة حسابات المستخدمين وصلاحياتهم مقتصرة على مدير النظام (Admin)' };
    }
    return { allowed: true };
  }

  // Student Affairs
  if (role === 'StudentAffairs') {
    var studentActions = [
      'getStudents', 'saveStudent', 'bulkSaveStudents',
      'getStudentAttendance', 'saveStudentAttendance', 'bulkSaveStudentAttendance',
      'getAcademicYears', 'saveAcademicYear', 'saveStudentEnrollment',
      'getBehaviorRecords', 'saveBehaviorCase',
      'getParentCommunications', 'saveParentCommunication',
      'getSettings', 'getAuditLogs', 'addAuditLog', 'logout', 'validateSession'
    ];
    if (studentActions.indexOf(action) !== -1) return { allowed: true };
    return { allowed: false, message: 'هذا الإجراء خارج اختصاص شؤون الطلاب' };
  }

  // Teacher & Staff Affairs
  if (role === 'TeacherAffairs' || role === 'HR') {
    var teacherActions = [
      'getEmployees', 'saveEmployee',
      'getAttendance', 'saveAttendance', 'bulkSaveAttendance',
      'getLeaves', 'saveLeave',
      'getPermissions', 'savePermission',
      'getSettings', 'getAuditLogs', 'addAuditLog', 'logout', 'validateSession'
    ];
    if (teacherActions.indexOf(action) !== -1) return { allowed: true };
    return { allowed: false, message: 'هذا الإجراء خارج اختصاص شؤون المعلمين والعاملين' };
  }

  // Social Specialist
  if (role === 'SocialSpecialist' || role === 'BehaviorOfficer') {
    var socialActions = [
      'getStudents',
      'getBehaviorRecords', 'saveBehaviorViolation', 'saveBehaviorCase',
      'getParentCommunications', 'saveParentCommunication',
      'getSettings', 'addAuditLog', 'logout', 'validateSession'
    ];
    if (socialActions.indexOf(action) !== -1) return { allowed: true };
    return { allowed: false, message: 'هذا الإجراء خارج اختصاص الأخصائي الاجتماعي' };
  }

  // Training and Quality Officers
  if (role === 'TrainingOfficer' || role === 'QualityOfficer' || role === 'Viewer') {
    var readOnlyStaffActions = [
      'getStudents', 'getStudentAttendance', 'getEmployees', 'getAttendance',
      'getLeaves', 'getPermissions', 'getBehaviorRecords', 'getAcademicYears',
      'getParentCommunications', 'getSettings', 'getAuditLogs', 'addAuditLog',
      'logout', 'validateSession'
    ];
    if (readOnlyStaffActions.indexOf(action) !== -1) return { allowed: true };
    return { allowed: false, message: 'صلاحيات هذا الدور مخصصة للمتابعة والرقابة فقط دون إمكانية التعديل' };
  }

  return { allowed: false, message: 'دور غير مصرح له بتنفيذ هذا الإجراء' };
}

// -------------------------------------------------------------
// CRYPTOGRAPHIC HELPERS
// -------------------------------------------------------------

function hashStringSHA256(text) {
  if (!text) return '';
  var raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8);
  return bytesToHex(raw);
}

function computeSaltedHash(password, salt, iterations) {
  var key = password + salt;
  var raw = Utilities.computeHmacSha256Signature(key, salt, Utilities.Charset.UTF_8);
  var hex = bytesToHex(raw);

  // Iterative stretching for KDF resistance
  var rounds = Math.min(iterations || 1000, 1000);
  for (var i = 0; i < rounds; i++) {
    var step = Utilities.computeHmacSha256Signature(hex + salt, salt, Utilities.Charset.UTF_8);
    hex = bytesToHex(step);
  }
  return hex;
}

function bytesToHex(byteArray) {
  var hex = '';
  for (var i = 0; i < byteArray.length; i++) {
    var byteVal = byteArray[i];
    if (byteVal < 0) byteVal += 256;
    var byteHex = byteVal.toString(16);
    if (byteHex.length === 1) byteHex = '0' + byteHex;
    hex += byteHex;
  }
  return hex;
}

function updateUserPasswordColumns(ss, rowIndex, hash, salt, algo, iter) {
  var sheet = ss.getSheetByName(SHEETS.USERS);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  var hashCol = headers.indexOf('passwordHash') + 1;
  var saltCol = headers.indexOf('passwordSalt') + 1;
  var algoCol = headers.indexOf('passwordAlgorithm') + 1;
  var iterCol = headers.indexOf('passwordIterations') + 1;
  var plainCol = headers.indexOf('password') + 1;

  if (hashCol > 0) sheet.getRange(rowIndex, hashCol).setValue(hash);
  if (saltCol > 0) sheet.getRange(rowIndex, saltCol).setValue(salt);
  if (algoCol > 0) sheet.getRange(rowIndex, algoCol).setValue(algo);
  if (iterCol > 0) sheet.getRange(rowIndex, iterCol).setValue(iter);
  if (plainCol > 0) sheet.getRange(rowIndex, plainCol).setValue(''); // Purge plain text!
}

function saveUserSecure(ss, payload, actingAdminUsername, requestId) {
  var cleanPayload = Object.assign({}, payload);
  var plainPassword = cleanPayload.password;
  delete cleanPayload.password; // Never store plain password

  if (plainPassword && plainPassword.trim().length >= 8) {
    var salt = Utilities.getUuid().replace(/-/g, '');
    var hash = computeSaltedHash(plainPassword.trim(), salt, PBKDF2_ITERATIONS);
    cleanPayload.passwordHash = hash;
    cleanPayload.passwordSalt = salt;
    cleanPayload.passwordAlgorithm = 'PBKDF2-HMAC-SHA256';
    cleanPayload.passwordIterations = PBKDF2_ITERATIONS;
    cleanPayload.passwordChangedAt = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
  }

  upsertRecord(ss, SHEETS.USERS, 'username', cleanPayload);

  // Return clean user
  delete cleanPayload.passwordHash;
  delete cleanPayload.passwordSalt;
  return cleanPayload;
}

function getSanitizedUsersList(ss) {
  var rawUsers = getSheetData(ss, SHEETS.USERS);
  return rawUsers.map(function(u) {
    var clean = Object.assign({}, u);
    delete clean.password;
    delete clean.passwordHash;
    delete clean.passwordSalt;
    return clean;
  });
}

function recordAuthoritativeAudit(ss, requestId, username, role, action, entity, targetId, details) {
  try {
    var sheet = ss.getSheetByName(SHEETS.AUDIT_LOGS);
    if (!sheet) return;

    var logId = 'AUD_' + Utilities.getUuid().substring(0, 10);
    var nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    var row = [
      logId,
      nowStr,
      username || 'SYSTEM',
      role || 'SYSTEM',
      action || '',
      entity || '',
      targetId || '',
      details || '',
      requestId || ''
    ];
    sheet.appendRow(row);
  } catch (e) {}
}

// -------------------------------------------------------------
// SETTINGS DATA HANDLING (Staff-Only Decoupled)
// -------------------------------------------------------------

function getSettingsDataClean(ss) {
  var raw = getSheetData(ss, SHEETS.SETTINGS);
  var obj = {};
  raw.forEach(function(row) {
    var key = row.key;
    // Strictly filter out any retired modules from settings
    if (key === 'payrollRules' || key === 'scheduleConfig' || key === 'teacherPortalSettings' || key === 'parentPortalSettings' || key === 'samatConfig') {
      return;
    }
    try {
      obj[key] = JSON.parse(row.value);
    } catch (e) {
      obj[key] = row.value;
    }
  });
  return obj;
}

function saveSettingsDataClean(ss, settingsObj) {
  var sheet = ss.getSheetByName(SHEETS.SETTINGS);
  if (!sheet) return;

  sheet.clearContents();
  var headers = ['key', 'value', 'updatedAt'];
  sheet.appendRow(headers);
  styleHeaderRow(sheet, headers.length);

  var nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
  var rows = [];

  for (var k in settingsObj) {
    if (k === 'payrollRules' || k === 'scheduleConfig' || k === 'teacherPortalSettings' || k === 'parentPortalSettings' || k === 'samatConfig') {
      continue; // Skip retired settings
    }
    var val = typeof settingsObj[k] === 'object' ? JSON.stringify(settingsObj[k]) : String(settingsObj[k]);
    rows.push([k, val, nowStr]);
  }

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 3).setValues(rows);
  }
}

// -------------------------------------------------------------
// SERVER-SIDE ARCHIVE EXECUTOR
// -------------------------------------------------------------

function executeServerSideArchive(ss, actingAdmin, requestId) {
  var retiredSheets = [
    'Payroll',
    'Schedule',
    'Class_Attendance',
    'Schedule_Substitutions',
    'Homework',
    'Lesson_Instances',
    'Lesson_Content',
    'SAMAT'
  ];

  var archiveTimestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd_HHmmss');
  var totalRowsArchived = 0;
  var archivedEntities = [];

  for (var i = 0; i < retiredSheets.length; i++) {
    var sheetName = retiredSheets[i];
    var s = ss.getSheetByName(sheetName);
    if (s) {
      var rowCount = s.getLastRow();
      if (rowCount > 1) {
        var archiveSheetName = 'Archive_' + sheetName + '_' + archiveTimestamp;
        s.setName(archiveSheetName);
        s.hideSheet();
        totalRowsArchived += (rowCount - 1);
        archivedEntities.push(sheetName + ' (' + (rowCount - 1) + ' rows)');
      } else {
        ss.deleteSheet(s);
      }
    }
  }

  var receipt = {
    archivedAt: new Date().toISOString(),
    executedBy: actingAdmin,
    requestId: requestId,
    totalRowsArchived: totalRowsArchived,
    archivedEntities: archivedEntities,
    checksum: hashStringSHA256(archiveTimestamp + totalRowsArchived + actingAdmin)
  };

  recordAuthoritativeAudit(ss, requestId, actingAdmin, 'Admin', 'SERVER_ARCHIVE', 'SYSTEM', receipt.checksum, 'أرشفة وتجميد ' + totalRowsArchived + ' سجل من الجداول الملغاة');
  return receipt;
}

// -------------------------------------------------------------
// SPREADSHEET UTILITIES & INITIALIZATION
// -------------------------------------------------------------

function initSheetsIfMissing(ss) {
  var sheetDefinitions = {
    Users: ['id', 'username', 'passwordHash', 'passwordSalt', 'passwordAlgorithm', 'passwordIterations', 'fullName', 'role', 'status', 'department', 'email', 'createdAt', 'lastLogin', 'passwordChangedAt'],
    Sessions: ['sessionId', 'tokenHash', 'userId', 'username', 'fullName', 'role', 'createdAt', 'expiresAt', 'status'],
    Employees: ['id', 'employeeNumber', 'name', 'nationalId', 'department', 'jobTitle', 'hireDate', 'workingHours', 'workStartTime', 'workEndTime', 'daysOff', 'status', 'phone', 'email'],
    Attendance: ['id', 'employeeId', 'employeeName', 'department', 'date', 'dayName', 'checkIn', 'checkOut', 'workingHours', 'lateMinutes', 'earlyLeaveMinutes', 'overtimeHours', 'status', 'notes', 'checkInTimestamp', 'checkOutTimestamp', 'updatedAt'],
    Leaves: ['id', 'employeeId', 'employeeName', 'department', 'leaveType', 'startDate', 'endDate', 'daysCount', 'status', 'reason', 'createdAt', 'approvedBy'],
    Permissions: ['id', 'employeeId', 'employeeName', 'department', 'date', 'permissionFrom', 'permissionTo', 'durationMinutes', 'permissionType', 'reason', 'status', 'createdAt'],
    Settings: ['key', 'value', 'updatedAt'],
    Audit_Logs: ['id', 'timestamp', 'username', 'userRole', 'action', 'entity', 'targetId', 'details', 'requestId'],
    Students: ['id', 'studentCode', 'name', 'nationalId', 'grade', 'classroom', 'gender', 'birthDate', 'religion', 'parentName', 'parentPhone', 'parentJob', 'status', 'createdAt'],
    Student_Attendance: ['id', 'studentId', 'studentCode', 'studentName', 'grade', 'classroom', 'date', 'dayName', 'status', 'lateMinutes', 'excused', 'notes', 'recordedBy', 'recordedAt'],
    Behavior_Violations: ['id', 'studentId', 'studentName', 'grade', 'classroom', 'violationType', 'level', 'actionTaken', 'pointsDeducted', 'date', 'recordedBy', 'notes'],
    Behavior_Cases: ['id', 'studentId', 'studentName', 'grade', 'classroom', 'caseType', 'status', 'socialSpecialistNotes', 'actionPlan', 'openedDate', 'closedDate'],
    Positive_Behavior_Types: ['id', 'title', 'category', 'points', 'description'],
    Academic_Years: ['id', 'name', 'startDate', 'endDate', 'isActive', 'status'],
    Student_Enrollments: ['id', 'studentId', 'academicYearId', 'grade', 'classroom', 'status', 'enrollmentDate'],
    Parent_Communications: ['id', 'studentId', 'studentName', 'parentName', 'parentPhone', 'type', 'reason', 'notes', 'staffMember', 'date'],
    Locations: ['id', 'name', 'type', 'capacity', 'building', 'floor']
  };

  for (var name in sheetDefinitions) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      var headers = sheetDefinitions[name];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      styleHeaderRow(sheet, headers.length);
    } else {
      var lastCol = sheet.getLastColumn();
      var lastRow = sheet.getLastRow();
      if (lastCol === 0 || lastRow === 0) {
        var headers = sheetDefinitions[name];
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        styleHeaderRow(sheet, headers.length);
      }
    }
  }
}

function getSheetData(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol === 0) return [];

  var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = values[0];
  var result = [];

  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    var isBlank = true;
    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      var val = row[c];
      if (val !== '' && val !== null && val !== undefined) isBlank = false;
      obj[headers[c]] = val;
    }
    if (!isBlank) result.push(obj);
  }
  return result;
}

function upsertRecord(ss, sheetName, keyColumn, record) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) return;

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var keyColIndex = headers.indexOf(keyColumn);
  if (keyColIndex === -1) return;

  var keyValue = record[keyColumn];
  var targetRow = -1;

  if (lastRow > 1) {
    var keyValues = sheet.getRange(2, keyColIndex + 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < keyValues.length; i++) {
      if (String(keyValues[i][0]).toLowerCase() === String(keyValue).toLowerCase()) {
        targetRow = i + 2;
        break;
      }
    }
  }

  var rowData = headers.map(function(h) {
    var val = record[h];
    return val !== undefined ? val : '';
  });

  if (targetRow > 0) {
    sheet.getRange(targetRow, 1, 1, headers.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
}

function deleteRecord(ss, sheetName, keyColumn, keyValue) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol === 0) return;

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var keyColIndex = headers.indexOf(keyColumn);
  if (keyColIndex === -1) return;

  var keyValues = sheet.getRange(2, keyColIndex + 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < keyValues.length; i++) {
    if (String(keyValues[i][0]).toLowerCase() === String(keyValue).toLowerCase()) {
      sheet.deleteRow(i + 2);
      break;
    }
  }
}

function styleHeaderRow(sheet, numCols) {
  try {
    var range = sheet.getRange(1, 1, 1, numCols);
    range.setBackground('#008e8b');
    range.setFontColor('#FFFFFF');
    range.setFontWeight('bold');
    range.setFontSize(10);
    sheet.setFrozenRows(1);
  } catch (e) {}
}

function createJsonResponse(obj, statusCode) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
