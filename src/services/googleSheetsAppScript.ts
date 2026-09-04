/**
 * ==============================================================================
 * Google Apps Script - HR Attendance Management System Backend API
 * نظام إدارة الحضور والانصراف والموارد البشرية - خادم المعالجة وقاعدة البيانات
 * ==============================================================================
 * 
 * Instructions:
 * 1. Open Google Sheet -> Extensions -> Apps Script
 * 2. Paste this code and click Save
 * 3. Deploy -> New deployment -> Web app
 * 4. Execute as: Me
 * 5. Who has access: Anyone
 */

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * ==============================================================================
 * Google Apps Script - Comprehensive School Management System Backend API
 * نظام إدارة المدارس المتكامل وشؤون الطلاب والعام الدراسي والحضور والجدول والسلوك
 * ==============================================================================
 * 
 * Deployment Instructions:
 * 1. Open your Google Sheet.
 * 2. Click Extensions (التطبيقات الملحقة) -> Apps Script.
 * 3. Replace all code with this script.
 * 4. Click Deploy (نشر) -> New deployment (نشر جديد).
 * 5. Select type: Web App (تطبيق ويب).
 * 6. Set Description: "School Management Production Backend".
 * 7. Set Execute as: "Me" (أنا).
 * 8. Set Who has access: "Anyone" (أي مستخدم).
 * 9. Click Deploy.
 */

var SHEETS = {
  USERS: 'Users',
  EMPLOYEES: 'Employees',
  ATTENDANCE: 'Attendance',
  LEAVES: 'Leaves',
  PERMISSIONS: 'Permissions',
  SETTINGS: 'Settings',
  AUDIT_LOGS: 'Audit_Logs',
  MONTHLY_SUMMARY: 'Monthly_Summary',
  ANNUAL_SUMMARY: 'Annual_Summary',
  STUDENTS: 'Students',
  STUDENT_ATTENDANCE: 'Student_Attendance',
  CLASS_ATTENDANCE: 'Class_Attendance',
  BEHAVIOR_TYPES: 'Behavior_Types',
  POSITIVE_BEHAVIOR_TYPES: 'Positive_Behavior_Types',
  BEHAVIOR_VIOLATIONS: 'Behavior_Violations',
  BEHAVIOR_LEDGER: 'Behavior_Ledger',
  BEHAVIOR_CASES: 'Behavior_Cases',
  SCHEDULE: 'Schedule',
  SCHEDULE_SUBSTITUTIONS: 'Schedule_Substitutions',
  LESSON_INSTANCES: 'Lesson_Instances',
  LESSON_CONTENT: 'Lesson_Content',
  PAYROLL: 'Payroll',
  ACADEMIC_YEARS: 'Academic_Years',
  STUDENT_ENROLLMENTS: 'Student_Enrollments',
  STUDENT_TRANSFERS: 'Student_Transfers',
  PROMOTION_RULES: 'Promotion_Rules',
  PARENT_COMMUNICATIONS: 'Parent_Communications',
  LOCATIONS: 'Locations'
};

/**
 * Handle GET Requests
 */
function doGet(e) {
  var params = e ? e.parameter : {};
  var action = params.action || 'getAll';
  var requestId = 'REQ_' + Utilities.getUuid().substring(0, 8);
  var output = { 
    status: 'success', 
    timestamp: new Date().toISOString(),
    serverTime: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'),
    requestId: requestId
  };

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    initSheetsIfMissing(ss);

    // SECURITY: Disallow authentication attempts via GET
    if (action === 'login' || params.password || params.pass) {
      output.status = 'error';
      output.errorCode = 'AUTH_METHOD_NOT_ALLOWED';
      output.message = 'تسجيل الدخول وإرسال كلمات المرور عبر GET غير مسموح به لأسباب أمنية. يرجى استخدام طلب POST حصراً.';
      return ContentService.createTextOutput(JSON.stringify(output)).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'getAll') {
      output.data = {
        users: getSanitizedUsers(ss),
        employees: getSheetData(ss, SHEETS.EMPLOYEES),
        attendance: getSheetData(ss, SHEETS.ATTENDANCE),
        leaves: getSheetData(ss, SHEETS.LEAVES),
        permissions: getSheetData(ss, SHEETS.PERMISSIONS),
        settings: getSettingsData(ss),
        auditLogs: getSheetData(ss, SHEETS.AUDIT_LOGS),
        students: getSheetData(ss, SHEETS.STUDENTS),
        studentAttendance: getSheetData(ss, SHEETS.STUDENT_ATTENDANCE),
        classAttendance: getSheetData(ss, SHEETS.CLASS_ATTENDANCE),
        behaviorTypes: getSheetData(ss, SHEETS.BEHAVIOR_TYPES),
        positiveBehaviorTypes: getSheetData(ss, SHEETS.POSITIVE_BEHAVIOR_TYPES),
        behaviorViolations: getSheetData(ss, SHEETS.BEHAVIOR_VIOLATIONS),
        behaviorLedger: getSheetData(ss, SHEETS.BEHAVIOR_LEDGER),
        behaviorCases: getSheetData(ss, SHEETS.BEHAVIOR_CASES),
        schedule: getSheetData(ss, SHEETS.SCHEDULE),
        scheduleSubstitutions: getSheetData(ss, SHEETS.SCHEDULE_SUBSTITUTIONS),
        lessonInstances: getSheetData(ss, SHEETS.LESSON_INSTANCES),
        lessonContent: getSheetData(ss, SHEETS.LESSON_CONTENT),
        payroll: getSheetData(ss, SHEETS.PAYROLL),
        academicYears: getSheetData(ss, SHEETS.ACADEMIC_YEARS),
        studentEnrollments: getSheetData(ss, SHEETS.STUDENT_ENROLLMENTS),
        studentTransfers: getSheetData(ss, SHEETS.STUDENT_TRANSFERS),
        promotionRules: getSheetData(ss, SHEETS.PROMOTION_RULES),
        parentCommunications: getSheetData(ss, SHEETS.PARENT_COMMUNICATIONS),
        locations: getSheetData(ss, SHEETS.LOCATIONS)
      };
    } else if (action === 'getEmployees') {
      output.data = getSheetData(ss, SHEETS.EMPLOYEES);
    } else if (action === 'getStudents') {
      output.data = getSheetData(ss, SHEETS.STUDENTS);
    } else if (action === 'getStudentsByParent') {
      var pPhone = (params.phone || '').trim();
      var pNationalId = (params.nationalId || '').trim();
      var allStudents = getSheetData(ss, SHEETS.STUDENTS);
      output.data = allStudents.filter(function(s) {
        var matchPhone = pPhone && (String(s.parentPhone || '').includes(pPhone) || String(s.phone || '').includes(pPhone));
        var matchId = pNationalId && String(s.nationalId || '') === pNationalId;
        return matchPhone || matchId;
      });
    } else if (action === 'getAttendance') {
      var allAtt = getSheetData(ss, SHEETS.ATTENDANCE);
      if (params.date) {
        output.data = allAtt.filter(function(r) { return r.date === params.date; });
      } else {
        output.data = allAtt;
      }
    } else if (action === 'getStudentAttendance') {
      var stdAtt = getSheetData(ss, SHEETS.STUDENT_ATTENDANCE);
      if (params.date) {
        output.data = stdAtt.filter(function(r) { return r.date === params.date; });
      } else if (params.studentId) {
        output.data = stdAtt.filter(function(r) { return r.studentId === params.studentId; });
      } else {
        output.data = stdAtt;
      }
    } else if (action === 'getClassAttendance') {
      output.data = getSheetData(ss, SHEETS.CLASS_ATTENDANCE);
    } else if (action === 'getLeaves') {
      output.data = getSheetData(ss, SHEETS.LEAVES);
    } else if (action === 'getPermissions') {
      output.data = getSheetData(ss, SHEETS.PERMISSIONS);
    } else if (action === 'getUsers') {
      output.data = getSanitizedUsers(ss);
    } else if (action === 'getAcademicYears') {
      output.data = getSheetData(ss, SHEETS.ACADEMIC_YEARS);
    } else if (action === 'getStudentEnrollments') {
      output.data = getSheetData(ss, SHEETS.STUDENT_ENROLLMENTS);
    } else if (action === 'ping') {
      output.message = 'Server is running securely and connected successfully!';
      output.spreadsheetName = ss.getName();
    } else {
      output.status = 'error';
      output.errorCode = 'UNKNOWN_ACTION';
      output.message = 'Unknown GET action: ' + action;
    }
  } catch (err) {
    output.status = 'error';
    output.errorCode = 'SERVER_ERROR';
    output.message = err.toString();
  }

  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle POST Requests
 */
function doPost(e) {
  var requestId = 'REQ_' + Utilities.getUuid().substring(0, 8);
  var output = { 
    status: 'success', 
    timestamp: new Date().toISOString(),
    serverTime: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'),
    requestId: requestId
  };

  var lock = LockService.getScriptLock();
  var lockAcquired = false;

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    initSheetsIfMissing(ss);

    var postData = {};
    if (e && e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        postData = {};
      }
    }

    var action = postData.action || 'syncAll';
    var payload = postData.data;
    var callerRole = postData.userRole || (postData.user && postData.user.role) || '';

    // 1. AUTHENTICATION (POST ONLY)
    if (action === 'login') {
      var username = (postData.username || (payload && payload.username) || '').trim().toLowerCase();
      var password = (postData.password || (payload && payload.password) || '').trim();
      var authResult = authenticateUser(ss, username, password);
      
      if (authResult.success) {
        output.status = 'success';
        output.message = 'تم تسجيل الدخول بنجاح';
        output.user = authResult.user;
        output.token = authResult.token;
        output.expiresAt = authResult.expiresAt;
      } else {
        output.status = 'error';
        output.errorCode = 'INVALID_CREDENTIALS';
        output.message = authResult.message;
      }
      return ContentService.createTextOutput(JSON.stringify(output)).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. SECURITY GUARD: PAYROLL PROTECTION (Admin Only)
    var isPayrollAction = (
      action === 'getPayroll' || 
      action === 'savePayroll' || 
      action === 'bulkSavePayroll' || 
      action === 'approvePayroll' || 
      action === 'lockPayroll' || 
      action === 'generatePayroll'
    );
    if (isPayrollAction && callerRole !== 'Admin') {
      output.status = 'error';
      output.errorCode = 'FORBIDDEN_PAYROLL_ACCESS';
      output.message = 'غير مصرح بالوصول إلى بيانات الرواتب أو تعديلها. تتطلب صلاحية مدير النظام (Admin Only).';
      return ContentService.createTextOutput(JSON.stringify(output)).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. CONCURRENCY: Acquire Lock for batch writes & sensitive mutations
    var writeActions = [
      'syncAll', 'bulkSaveAttendance', 'bulkSaveStudents', 'batchSaveStudentEnrollments',
      'savePayroll', 'bulkSavePayroll', 'approvePayroll', 'lockPayroll', 'saveStudentTransfer'
    ];
    if (writeActions.indexOf(action) !== -1) {
      try {
        lockAcquired = lock.tryLock(10000); // 10 seconds wait
      } catch (lockErr) {
        console.warn('LockService error:', lockErr);
      }
    }

    if (action === 'syncAll' && payload) {
      if (callerRole !== 'Admin') {
        output.status = 'error';
        output.errorCode = 'FORBIDDEN_SYNC_ALL';
        output.message = 'مزامنة الاستبدال الشامل (syncAll) مقصورة على مديري النظام فقط.';
        return ContentService.createTextOutput(JSON.stringify(output)).setMimeType(ContentService.MimeType.JSON);
      }

      // Safe Sheet setter that guards against accidental empty wipeout
      var safeSetSheetData = function(sheetName, items) {
        if (Array.isArray(items)) {
          if (items.length === 0 && !payload.allowEmptyWipe) {
            console.warn('Skipping empty array for sheet ' + sheetName + ' to prevent accidental wipeout.');
            return;
          }
          setSheetData(ss, sheetName, items);
        }
      };

      if (payload.employees) safeSetSheetData(SHEETS.EMPLOYEES, payload.employees);
      if (payload.attendance) safeSetSheetData(SHEETS.ATTENDANCE, payload.attendance);
      if (payload.leaves) safeSetSheetData(SHEETS.LEAVES, payload.leaves);
      if (payload.users) safeSetSheetData(SHEETS.USERS, payload.users);
      if (payload.permissions) safeSetSheetData(SHEETS.PERMISSIONS, payload.permissions);
      if (payload.settings) saveSettingsData(ss, payload.settings);
      if (payload.auditLogs) safeSetSheetData(SHEETS.AUDIT_LOGS, payload.auditLogs);
      if (payload.students) safeSetSheetData(SHEETS.STUDENTS, payload.students);
      if (payload.studentAttendance) safeSetSheetData(SHEETS.STUDENT_ATTENDANCE, payload.studentAttendance);
      if (payload.classAttendance) safeSetSheetData(SHEETS.CLASS_ATTENDANCE, payload.classAttendance);
      if (payload.behaviorTypes) safeSetSheetData(SHEETS.BEHAVIOR_TYPES, payload.behaviorTypes);
      if (payload.positiveBehaviorTypes) safeSetSheetData(SHEETS.POSITIVE_BEHAVIOR_TYPES, payload.positiveBehaviorTypes);
      if (payload.behaviorViolations) safeSetSheetData(SHEETS.BEHAVIOR_VIOLATIONS, payload.behaviorViolations);
      if (payload.behaviorLedger) safeSetSheetData(SHEETS.BEHAVIOR_LEDGER, payload.behaviorLedger);
      if (payload.behaviorCases) safeSetSheetData(SHEETS.BEHAVIOR_CASES, payload.behaviorCases);
      if (payload.schedule) safeSetSheetData(SHEETS.SCHEDULE, payload.schedule);
      if (payload.scheduleSubstitutions) safeSetSheetData(SHEETS.SCHEDULE_SUBSTITUTIONS, payload.scheduleSubstitutions);
      if (payload.lessonInstances) safeSetSheetData(SHEETS.LESSON_INSTANCES, payload.lessonInstances);
      if (payload.lessonContent) safeSetSheetData(SHEETS.LESSON_CONTENT, payload.lessonContent);
      if (payload.payroll && callerRole === 'Admin') safeSetSheetData(SHEETS.PAYROLL, payload.payroll);
      if (payload.academicYears) safeSetSheetData(SHEETS.ACADEMIC_YEARS, payload.academicYears);
      if (payload.studentEnrollments) safeSetSheetData(SHEETS.STUDENT_ENROLLMENTS, payload.studentEnrollments);
      if (payload.studentTransfers) safeSetSheetData(SHEETS.STUDENT_TRANSFERS, payload.studentTransfers);
      if (payload.promotionRules) safeSetSheetData(SHEETS.PROMOTION_RULES, payload.promotionRules);
      if (payload.parentCommunications) safeSetSheetData(SHEETS.PARENT_COMMUNICATIONS, payload.parentCommunications);
      if (payload.locations) safeSetSheetData(SHEETS.LOCATIONS, payload.locations);
      output.message = 'Full synchronization completed successfully!';
    } else if (action === 'saveAttendance' && payload) {
      upsertAttendanceRecord(ss, payload);
      output.message = 'Attendance record saved successfully!';
    } else if (action === 'bulkSaveAttendance' && payload && Array.isArray(payload)) {
      payload.forEach(function(rec) { upsertAttendanceRecord(ss, rec); });
      output.message = 'Bulk attendance (' + payload.length + ' records) saved successfully!';
    } else if (action === 'saveStudent' && payload) {
      upsertRecord(ss, SHEETS.STUDENTS, 'id', payload);
      output.message = 'Student record saved successfully!';
    } else if (action === 'bulkSaveStudents' && payload && Array.isArray(payload)) {
      setSheetData(ss, SHEETS.STUDENTS, payload);
      output.message = 'Bulk students saved successfully!';
    } else if (action === 'deleteStudent' && payload && payload.id) {
      deleteRecord(ss, SHEETS.STUDENTS, 'id', payload.id);
      output.message = 'Student record deleted successfully!';
    } else if (action === 'saveStudentAttendance' && payload) {
      upsertRecord(ss, SHEETS.STUDENT_ATTENDANCE, 'id', payload);
      output.message = 'Student attendance saved!';
    } else if (action === 'bulkSaveStudentAttendance' && payload && Array.isArray(payload)) {
      payload.forEach(function(rec) { upsertRecord(ss, SHEETS.STUDENT_ATTENDANCE, 'id', rec); });
      output.message = 'Bulk student attendance saved!';
    } else if (action === 'saveClassAttendance' && payload && Array.isArray(payload)) {
      payload.forEach(function(rec) { upsertRecord(ss, SHEETS.CLASS_ATTENDANCE, 'id', rec); });
      output.message = 'Class attendance saved!';
    } else if (action === 'saveAcademicYear' && payload) {
      upsertRecord(ss, SHEETS.ACADEMIC_YEARS, 'id', payload);
      output.message = 'Academic year saved!';
    } else if (action === 'deleteAcademicYear' && payload && payload.id) {
      deleteRecord(ss, SHEETS.ACADEMIC_YEARS, 'id', payload.id);
      output.message = 'Academic year deleted!';
    } else if (action === 'saveStudentEnrollment' && payload) {
      upsertRecord(ss, SHEETS.STUDENT_ENROLLMENTS, 'id', payload);
      output.message = 'Student enrollment saved!';
    } else if (action === 'batchSaveStudentEnrollments' && payload && Array.isArray(payload)) {
      payload.forEach(function(rec) { upsertRecord(ss, SHEETS.STUDENT_ENROLLMENTS, 'id', rec); });
      output.message = 'Batch student enrollments saved!';
    } else if (action === 'saveStudentTransfer' && payload) {
      appendRecord(ss, SHEETS.STUDENT_TRANSFERS, payload);
      output.message = 'Student transfer saved!';
    } else if (action === 'saveBehaviorType' && payload) {
      upsertRecord(ss, SHEETS.BEHAVIOR_TYPES, 'id', payload);
      output.message = 'Behavior type saved!';
    } else if (action === 'deleteBehaviorType' && payload && payload.id) {
      deleteRecord(ss, SHEETS.BEHAVIOR_TYPES, 'id', payload.id);
      output.message = 'Behavior type deleted!';
    } else if (action === 'savePositiveBehaviorType' && payload) {
      upsertRecord(ss, SHEETS.POSITIVE_BEHAVIOR_TYPES, 'id', payload);
      output.message = 'Positive behavior type saved!';
    } else if (action === 'deletePositiveBehaviorType' && payload && payload.id) {
      deleteRecord(ss, SHEETS.POSITIVE_BEHAVIOR_TYPES, 'id', payload.id);
      output.message = 'Positive behavior type deleted!';
    } else if (action === 'saveViolation' && payload) {
      upsertRecord(ss, SHEETS.BEHAVIOR_VIOLATIONS, 'id', payload);
      output.message = 'Violation record saved!';
    } else if (action === 'deleteViolation' && payload && payload.id) {
      deleteRecord(ss, SHEETS.BEHAVIOR_VIOLATIONS, 'id', payload.id);
      output.message = 'Violation record deleted!';
    } else if (action === 'addBehaviorLedger' && payload) {
      appendRecord(ss, SHEETS.BEHAVIOR_LEDGER, payload);
      output.message = 'Behavior ledger transaction saved!';
    } else if (action === 'saveBehaviorCase' && payload) {
      upsertRecord(ss, SHEETS.BEHAVIOR_CASES, 'id', payload);
      output.message = 'Behavior case saved!';
    } else if (action === 'saveScheduleItem' && payload) {
      upsertRecord(ss, SHEETS.SCHEDULE, 'id', payload);
      output.message = 'Schedule item saved!';
    } else if (action === 'deleteScheduleItem' && payload && payload.id) {
      deleteRecord(ss, SHEETS.SCHEDULE, 'id', payload.id);
      output.message = 'Schedule item deleted!';
    } else if (action === 'saveSubstitution' && payload) {
      upsertRecord(ss, SHEETS.SCHEDULE_SUBSTITUTIONS, 'id', payload);
      output.message = 'Schedule substitution saved!';
    } else if (action === 'deleteSubstitution' && payload && payload.id) {
      deleteRecord(ss, SHEETS.SCHEDULE_SUBSTITUTIONS, 'id', payload.id);
      output.message = 'Schedule substitution deleted!';
    } else if (action === 'saveLessonInstance' && payload) {
      upsertRecord(ss, SHEETS.LESSON_INSTANCES, 'id', payload);
      output.message = 'Lesson instance saved!';
    } else if (action === 'saveLessonContent' && payload) {
      upsertRecord(ss, SHEETS.LESSON_CONTENT, 'id', payload);
      output.message = 'Lesson content saved!';
    } else if (action === 'saveParentCommunication' && payload) {
      appendRecord(ss, SHEETS.PARENT_COMMUNICATIONS, payload);
      output.message = 'Parent communication log saved!';
    } else if (action === 'saveLocation' && payload) {
      upsertRecord(ss, SHEETS.LOCATIONS, 'id', payload);
      output.message = 'Location saved!';
    } else if (action === 'deleteLocation' && payload && payload.id) {
      deleteRecord(ss, SHEETS.LOCATIONS, 'id', payload.id);
      output.message = 'Location deleted!';
    } else if (action === 'saveEmployee' && payload) {
      upsertRecord(ss, SHEETS.EMPLOYEES, 'id', payload);
      output.message = 'Employee record saved successfully!';
    } else if (action === 'deleteEmployee' && payload && payload.id) {
      deleteRecord(ss, SHEETS.EMPLOYEES, 'id', payload.id);
      output.message = 'Employee record deleted successfully!';
    } else if (action === 'saveLeave' && payload) {
      upsertRecord(ss, SHEETS.LEAVES, 'id', payload);
      output.message = 'Leave record saved successfully!';
    } else if (action === 'deleteLeave' && payload && payload.id) {
      deleteRecord(ss, SHEETS.LEAVES, 'id', payload.id);
      output.message = 'Leave record deleted successfully!';
    } else if (action === 'saveUser' && payload) {
      // If saving user password, ensure it is hashed
      if (payload.password && payload.password.length < 60) {
        payload.password = hashStringSHA256(payload.password);
      }
      upsertRecord(ss, SHEETS.USERS, 'username', payload);
      output.message = 'User record saved successfully!';
    } else if (action === 'deleteUser' && payload && payload.id) {
      deleteRecord(ss, SHEETS.USERS, 'id', payload.id);
      output.message = 'User record deleted successfully!';
    } else if (action === 'saveSettings' && payload) {
      saveSettingsData(ss, payload);
      output.message = 'Settings saved successfully!';
    } else if (action === 'addAuditLog' && payload) {
      appendRecord(ss, SHEETS.AUDIT_LOGS, payload);
      output.message = 'Audit log recorded!';
    } else if ((action === 'savePayroll' || action === 'bulkSavePayroll') && payload && callerRole === 'Admin') {
      if (Array.isArray(payload)) {
        payload.forEach(function(rec) { upsertRecord(ss, SHEETS.PAYROLL, 'id', rec); });
      } else {
        upsertRecord(ss, SHEETS.PAYROLL, 'id', payload);
      }
      output.message = 'Payroll record(s) saved successfully!';
    } else {
      output.status = 'error';
      output.errorCode = 'UNKNOWN_ACTION';
      output.message = 'Unknown POST action: ' + action;
    }
  } catch (err) {
    output.status = 'error';
    output.errorCode = 'SERVER_ERROR';
    output.message = err.toString();
  } finally {
    if (lockAcquired) {
      try {
        lock.releaseLock();
      } catch (relErr) {}
    }
  }

  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Authenticate User by Username and Password against Users sheet
 */
function authenticateUser(ss, inputUsername, inputPassword) {
  if (!inputUsername || !inputPassword) {
    return { success: false, message: 'يرجى إدخال اسم المستخدم وكلمة المرور' };
  }

  var users = getSheetData(ss, SHEETS.USERS);

  // If table is completely empty, initialize default admin
  if (users.length === 0) {
    var defaultAdmin = {
      id: '001',
      username: 'admin',
      password: 'admin123',
      fullName: 'مدير النظام',
      role: 'Admin',
      status: 'Active',
      department: 'الإدارة العامة والتوجيه',
      employeeId: 'EMP001',
      createdAt: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'),
      lastLogin: ''
    };
    upsertRecord(ss, SHEETS.USERS, 'username', defaultAdmin);
    users = [defaultAdmin];
  }

  var cleanUser = inputUsername.toLowerCase();
  var matchedUser = null;
  var userRowIndex = -1;

  for (var i = 0; i < users.length; i++) {
    var u = users[i];
    var uName = String(u.username || u.Username || u.User_Name || u['اسم المستخدم'] || u['اسم_المستخدم'] || '').trim().toLowerCase();
    var uId = String(u.id || u.User_ID || u.userId || '').trim().toLowerCase();
    
    if (uName === cleanUser || uId === cleanUser) {
      matchedUser = u;
      userRowIndex = i + 2; // +2 for header offset
      break;
    }
  }

  if (!matchedUser) {
    return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة.' };
  }

  // Check Status
  var status = String(matchedUser.status || matchedUser.Status || matchedUser['الحالة'] || 'Active').trim();
  var isActive = (matchedUser.isActive === true || matchedUser.isActive === 'true' || matchedUser.isActive === undefined);
  if (status.toLowerCase() === 'inactive' || status.toLowerCase() === 'disabled' || status === 'معطل' || !isActive) {
    return { success: false, message: 'هذا الحساب غير مفعل حالياً. يرجى مراجعة إدارة المدرسة.' };
  }

  // Check Password (supports plain text or SHA-256 hash)
  var storedPassword = String(matchedUser.password || matchedUser.Password || matchedUser['كلمة المرور'] || matchedUser['كلمة_السر'] || matchedUser['كلمه السر'] || matchedUser.pass || '').trim();
  var inputHashed = hashStringSHA256(inputPassword);

  var isPlainMatch = (storedPassword === inputPassword);
  var isHashMatch = (storedPassword === inputHashed);
  var passwordMatches = isPlainMatch || isHashMatch;

  if (!passwordMatches) {
    return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة.' };
  }

  // Auto-migrate plain text password to SHA-256 hash in sheet
  try {
    var sheet = ss.getSheetByName(SHEETS.USERS);
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var passCol = -1;
    for (var hIdx = 0; hIdx < headers.length; hIdx++) {
      var hName = String(headers[hIdx]).toLowerCase();
      if (hName === 'password' || hName === 'كلمة المرور' || hName === 'كلمة_السر' || hName === 'كلمه السر') {
        passCol = hIdx + 1;
        break;
      }
    }

    if (isPlainMatch && !isHashMatch && passCol > 0 && userRowIndex > 0) {
      sheet.getRange(userRowIndex, passCol).setValue(inputHashed);
    }

    // Update lastLogin in sheet
    var lastLoginCol = headers.indexOf('lastLogin') + 1;
    if (lastLoginCol > 0 && userRowIndex > 0) {
      var nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
      sheet.getRange(userRowIndex, lastLoginCol).setValue(nowStr);
    }
  } catch (e) {
    console.warn('Error during password migration/lastLogin update:', e);
  }

  // Generate secure session token
  var sessionToken = 'NTSS_' + Utilities.getUuid() + '_' + hashStringSHA256(matchedUser.id + '_' + new Date().getTime());
  var expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  var isDefaultAdmin = (cleanUser === 'admin' && inputPassword === 'admin123');

  // Return clean sanitized user without password
  var sanitized = {
    id: String(matchedUser.id || matchedUser.User_ID || matchedUser.userId || '001'),
    username: String(matchedUser.username || matchedUser.Username || inputUsername),
    fullName: String(matchedUser.fullName || matchedUser.Full_Name || matchedUser.name || matchedUser['الاسم'] || 'مستخدم النظام'),
    role: String(matchedUser.role || matchedUser.Role || matchedUser['الصلاحية'] || 'Admin'),
    status: status,
    department: String(matchedUser.department || matchedUser.Department || matchedUser['القسم'] || ''),
    employeeId: String(matchedUser.employeeId || matchedUser.Employee_ID || ''),
    mustChangePassword: isDefaultAdmin,
    sessionToken: sessionToken,
    lastLogin: new Date().toISOString()
  };

  return { 
    success: true, 
    user: sanitized, 
    token: sessionToken, 
    expiresAt: expiresAt 
  };
}

function hashStringSHA256(text) {
  if (!text) return '';
  var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8);
  var hex = '';
  for (var i = 0; i < rawHash.length; i++) {
    var byteVal = rawHash[i];
    if (byteVal < 0) byteVal += 256;
    var byteHex = byteVal.toString(16);
    if (byteHex.length === 1) byteHex = '0' + byteHex;
    hex += byteHex;
  }
  return hex;
}

function getSanitizedUsers(ss) {
  var rawUsers = getSheetData(ss, SHEETS.USERS);
  return rawUsers.map(function(u) {
    var clean = Object.assign({}, u);
    delete clean.password;
    delete clean.Password;
    return clean;
  });
}

function initSheetsIfMissing(ss, forceFormat) {
  var sheetDefinitions = {
    Users: ['id', 'username', 'password', 'fullName', 'role', 'status', 'department', 'employeeId', 'createdAt', 'lastLogin'],
    Employees: ['id', 'name', 'nationalId', 'department', 'jobTitle', 'hireDate', 'basicSalary', 'workingHours', 'workStartTime', 'workEndTime', 'daysOff', 'status', 'phone', 'email'],
    Attendance: ['id', 'employeeId', 'employeeName', 'department', 'date', 'dayName', 'checkIn', 'checkOut', 'workingHours', 'lateMinutes', 'earlyLeaveMinutes', 'overtimeHours', 'status', 'notes', 'checkInTimestamp', 'checkOutTimestamp', 'updatedAt'],
    Leaves: ['id', 'employeeId', 'employeeName', 'department', 'leaveType', 'startDate', 'endDate', 'daysCount', 'status', 'reason', 'createdAt', 'approvedBy'],
    Permissions: ['id', 'employeeId', 'employeeName', 'department', 'date', 'permissionFrom', 'permissionTo', 'durationMinutes', 'permissionType', 'reason', 'status', 'createdAt'],
    Settings: ['key', 'value', 'updatedAt'],
    Audit_Logs: ['id', 'timestamp', 'username', 'userRole', 'action', 'entity', 'details', 'oldValue', 'newValue'],
    Students: ['id', 'studentCode', 'nationalId', 'name', 'gender', 'birthDate', 'grade', 'classroom', 'section', 'parentName', 'parentPhone', 'parentJob', 'address', 'status', 'initialBehaviorScore', 'notes', 'createdAt', 'updatedAt'],
    Student_Attendance: ['id', 'studentId', 'studentName', 'grade', 'classroom', 'date', 'dayName', 'status', 'checkInTime', 'lateMinutes', 'earlyLeaveMinutes', 'isExcused', 'excuseReason', 'recordedBy', 'recordedAt', 'notes'],
    Class_Attendance: ['id', 'studentId', 'studentName', 'grade', 'classroom', 'date', 'periodNumber', 'subject', 'teacherId', 'teacherName', 'status', 'participationScore', 'homeworkDone', 'materialsBrought', 'takenBy', 'takenAt', 'notes'],
    Academic_Years: ['id', 'name', 'startDate', 'endDate', 'status', 'isDefault', 'isLocked', 'terms', 'workingDays', 'closedAt', 'closedBy', 'notes'],
    Student_Enrollments: ['id', 'studentId', 'academicYearId', 'academicYearName', 'grade', 'classroom', 'section', 'enrollmentDate', 'status', 'promotionStatus', 'promotionNotes', 'createdAt', 'updatedAt'],
    Student_Transfers: ['id', 'studentId', 'studentName', 'fromGrade', 'fromClassroom', 'toGrade', 'toClassroom', 'transferDate', 'reason', 'approvedBy', 'notes', 'createdAt'],
    Behavior_Types: ['id', 'code', 'name', 'level', 'pointsDeducted', 'category', 'description', 'actionRequired', 'isActive'],
    Positive_Behavior_Types: ['id', 'code', 'name', 'pointsAwarded', 'category', 'description', 'badgeIcon', 'isActive'],
    Behavior_Violations: ['id', 'studentId', 'studentName', 'grade', 'classroom', 'violationId', 'violationName', 'level', 'pointsDeducted', 'date', 'dayName', 'location', 'periodNumber', 'description', 'actionTaken', 'parentNotified', 'parentNotificationDate', 'status', 'recordedBy', 'createdAt', 'resolvedAt', 'notes'],
    Behavior_Ledger: ['id', 'studentId', 'studentName', 'academicYearId', 'date', 'type', 'points', 'balanceAfter', 'sourceType', 'sourceId', 'description', 'recordedBy', 'createdAt'],
    Behavior_Cases: ['id', 'caseNumber', 'studentId', 'studentName', 'grade', 'classroom', 'title', 'reason', 'severity', 'status', 'openedBy', 'createdAt', 'updatedAt', 'resolvedAt', 'resolutionSummary', 'parentInvolvement', 'followups'],
    Schedule: ['id', 'dayOfWeek', 'periodNumber', 'startTime', 'endTime', 'grade', 'classroom', 'subject', 'teacherId', 'teacherName', 'locationId', 'locationName', 'academicYearId', 'notes'],
    Schedule_Substitutions: ['id', 'date', 'dayOfWeek', 'periodNumber', 'grade', 'classroom', 'subject', 'originalTeacherId', 'originalTeacherName', 'substituteTeacherId', 'substituteTeacherName', 'reason', 'status', 'assignedBy', 'notes', 'createdAt'],
    Lesson_Instances: ['id', 'scheduleItemId', 'date', 'academicYearId', 'subject', 'grade', 'classroom', 'periodNumber', 'teacherId', 'teacherName', 'status', 'notes'],
    Lesson_Content: ['id', 'date', 'dayName', 'periodNumber', 'grade', 'classroom', 'subject', 'teacherId', 'teacherName', 'lessonTitle', 'unit', 'objectives', 'homework', 'absenceCount', 'studentsCount', 'createdAt', 'notes'],
    Payroll: ['id', 'employeeId', 'employeeName', 'nationalId', 'department', 'jobTitle', 'month', 'year', 'basicSalary', 'workingDays', 'presentDays', 'absentDays', 'lateDays', 'totalLateMinutes', 'overtimeHours', 'leaveDays', 'permissionHours', 'grossSalary', 'totalAllowances', 'totalDeductions', 'netSalary', 'status', 'calculatedAt', 'paidAt'],
    Promotion_Rules: ['id', 'fromGrade', 'toGrade', 'minimumAttendanceRate', 'minimumBehaviorScore', 'autoAction', 'retainedGrade', 'retainedClassroom', 'requiresAdminApproval', 'isActive'],
    Parent_Communications: ['id', 'studentId', 'studentName', 'date', 'type', 'reason', 'summary', 'parentResponse', 'outcome', 'recordedBy', 'createdAt'],
    Locations: ['id', 'name', 'type', 'building', 'floor', 'capacity', 'facilities', 'isActive']
  };

  for (var name in sheetDefinitions) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      var headers = sheetDefinitions[name];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      styleHeaderRow(sheet, headers.length);
      
      // If Users sheet is newly created, add initial admin user with password
      if (name === 'Users') {
        var nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
        var initialUserRow = ['001', 'admin', 'admin123', 'مدير النظام', 'Admin', 'Active', 'الإدارة العامة والتوجيه', 'EMP001', nowStr, ''];
        sheet.appendRow(initialUserRow);
      }
    } else {
      var lastCol = sheet.getLastColumn();
      var lastRow = sheet.getLastRow();

      if (lastCol === 0 || lastRow === 0) {
        var headers = sheetDefinitions[name];
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        styleHeaderRow(sheet, headers.length);
        if (name === 'Users') {
          var nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
          var initialUserRow = ['001', 'admin', 'admin123', 'مدير النظام', 'Admin', 'Active', 'الإدارة العامة والتوجيه', 'EMP001', nowStr, ''];
          sheet.appendRow(initialUserRow);
        }
      } else if (name === 'Users') {
        ensureUserSheetPasswordColumn(sheet);
      }

      if (forceFormat) {
        styleHeaderRow(sheet, sheet.getLastColumn());
      }
    }
  }
}

function ensureUserSheetPasswordColumn(userSheet) {
  var lastCol = userSheet.getLastColumn();
  if (lastCol <= 0) return;

  var headers = userSheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var hasPassword = false;
  var usernameIndex = -1;

  for (var i = 0; i < headers.length; i++) {
    var h = String(headers[i]).trim().toLowerCase();
    if (h === 'password' || h === 'كلمة المرور' || h === 'كلمة_السر' || h === 'كلمه السر' || h === 'pass') {
      hasPassword = true;
      break;
    }
    if (h === 'username' || h === 'اسم المستخدم' || h === 'اسم_المستخدم') {
      usernameIndex = i;
    }
  }

  if (!hasPassword) {
    if (usernameIndex >= 0) {
      userSheet.insertColumnAfter(usernameIndex + 1);
      userSheet.getRange(1, usernameIndex + 2).setValue('password');
    } else {
      userSheet.getRange(1, lastCol + 1).setValue('password');
    }
    styleHeaderRow(userSheet, userSheet.getLastColumn());
  }
}

function styleHeaderRow(sheet, colCount) {
  var headerRange = sheet.getRange(1, 1, 1, colCount);
  headerRange.setBackground('#008e8b');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
}

function getSheetData(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol === 0) return [];

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var dataRows = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  return dataRows.map(function(row) {
    var obj = {};
    headers.forEach(function(h, idx) {
      if (h) {
        var val = row[idx];
        if (val instanceof Date) {
          val = Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
        }
        if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
          try { val = JSON.parse(val); } catch (e) {}
        }
        obj[h] = val;
      }
    });
    return obj;
  });
}

function setSheetData(ss, sheetName, items) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();

  var headers = [];
  if (lastRow > 0 && lastCol > 0) {
    headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  }

  if (headers.length === 0 && items.length > 0) {
    headers = Object.keys(items[0]);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    styleHeaderRow(sheet, headers.length);
  }

  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, Math.max(1, lastCol)).clearContent();
  }

  if (items && items.length > 0 && headers.length > 0) {
    var rows = items.map(function(item) {
      return headers.map(function(h) {
        var val = item[h];
        if (val === undefined || val === null) return '';
        if (typeof val === 'object') return JSON.stringify(val);
        return val;
      });
    });
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
}

function upsertAttendanceRecord(ss, record) {
  var sheet = ss.getSheetByName(SHEETS.ATTENDANCE);
  if (!sheet) initSheetsIfMissing(ss);
  sheet = ss.getSheetByName(SHEETS.ATTENDANCE);

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  var empIdCol = headers.indexOf('employeeId') + 1;
  var dateCol = headers.indexOf('date') + 1;

  var rowIndexToUpdate = -1;

  if (lastRow > 1 && empIdCol > 0 && dateCol > 0) {
    var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    for (var i = 0; i < data.length; i++) {
      if (String(data[i][empIdCol - 1]) === String(record.employeeId) && String(data[i][dateCol - 1]) === String(record.date)) {
        rowIndexToUpdate = i + 2;
        break;
      }
    }
  }

  var rowValues = headers.map(function(h) {
    var val = record[h];
    if (val === undefined || val === null) return '';
    if (typeof val === 'object') return JSON.stringify(val);
    return val;
  });

  if (rowIndexToUpdate > 0) {
    sheet.getRange(rowIndexToUpdate, 1, 1, headers.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
}

function upsertRecord(ss, sheetName, keyField, record) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) return;

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var keyColIdx = headers.indexOf(keyField);
  if (keyColIdx === -1) {
    keyColIdx = headers.indexOf('id');
    if (keyColIdx === -1) return;
    keyField = 'id';
  }

  var rowIndex = -1;
  var existingRowData = null;
  if (lastRow > 1) {
    var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    for (var i = 0; i < data.length; i++) {
      if (String(data[i][keyColIdx]).toLowerCase() === String(record[keyField]).toLowerCase()) {
        rowIndex = i + 2;
        existingRowData = data[i];
        break;
      }
    }
  }

  var rowValues = headers.map(function(h, hIdx) {
    var val = record[h];
    if ((h === 'password' || h === 'Password' || h === 'كلمة المرور' || h === 'كلمة_السر' || h === 'كلمه السر') && (!val || val === '') && existingRowData) {
      val = existingRowData[hIdx];
    }
    if (val === undefined || val === null) return '';
    if (typeof val === 'object') return JSON.stringify(val);
    return val;
  });

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
}

function deleteRecord(ss, sheetName, keyField, keyValue) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol === 0) return;

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var keyColIdx = headers.indexOf(keyField);
  if (keyColIdx === -1) return;

  var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][keyColIdx]).toLowerCase() === String(keyValue).toLowerCase()) {
      sheet.deleteRow(i + 2);
      break;
    }
  }
}

function appendRecord(ss, sheetName, record) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;

  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) return;

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var rowValues = headers.map(function(h) {
    var val = record[h];
    if (val === undefined || val === null) return '';
    if (typeof val === 'object') return JSON.stringify(val);
    return val;
  });

  sheet.appendRow(rowValues);
}

function getSettingsData(ss) {
  var sheet = ss.getSheetByName(SHEETS.SETTINGS);
  if (!sheet || sheet.getLastRow() <= 1) return {};

  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
  var settings = {};
  data.forEach(function(row) {
    var key = row[0];
    var val = row[1];
    if (key) {
      if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
        try { val = JSON.parse(val); } catch(e) {}
      }
      settings[key] = val;
    }
  });
  return settings;
}

function saveSettingsData(ss, settingsObj) {
  var sheet = ss.getSheetByName(SHEETS.SETTINGS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.SETTINGS);
    sheet.getRange(1, 1, 1, 3).setValues([['key', 'value', 'updatedAt']]);
    styleHeaderRow(sheet, 3);
  }

  var now = new Date().toISOString();
  var rows = [];
  for (var key in settingsObj) {
    var val = settingsObj[key];
    if (typeof val === 'object') val = JSON.stringify(val);
    rows.push([key, val, now]);
  }

  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).clearContent();
  }

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 3).setValues(rows);
  }
}
`;

