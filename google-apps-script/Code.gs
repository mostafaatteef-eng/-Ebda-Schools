/**
 * ==============================================================================
 * Google Apps Script - HR Attendance Management System Backend API
 * نظام إدارة الحضور والانصراف والموارد البشرية - خادم المعالجة وقاعدة البيانات
 * ==============================================================================
 * 
 * Deployment Instructions:
 * 1. Open your Google Sheet.
 * 2. Click Extensions (التطبيقات الملحقة) -> Apps Script.
 * 3. Replace all code with this script.
 * 4. Click Deploy (نشر) -> New deployment (نشر جديد).
 * 5. Select type: Web App (تطبيق ويب).
 * 6. Set Description: "HR Production Backend".
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
  ANNUAL_SUMMARY: 'Annual_Summary'
};

/**
 * Handle GET Requests
 */
function doGet(e) {
  var params = e ? e.parameter : {};
  var action = params.action || 'getAll';
  var output = { status: 'success', timestamp: new Date().toISOString() };

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    initSheetsIfMissing(ss);

    if (action === 'getAll') {
      output.data = {
        users: getSanitizedUsers(ss),
        employees: getSheetData(ss, SHEETS.EMPLOYEES),
        attendance: getSheetData(ss, SHEETS.ATTENDANCE),
        leaves: getSheetData(ss, SHEETS.LEAVES),
        permissions: getSheetData(ss, SHEETS.PERMISSIONS),
        settings: getSettingsData(ss),
        auditLogs: getSheetData(ss, SHEETS.AUDIT_LOGS)
      };
    } else if (action === 'login') {
      var username = (params.username || '').trim().toLowerCase();
      var password = (params.password || '').trim();
      var authResult = authenticateUser(ss, username, password);
      
      if (authResult.success) {
        output.status = 'success';
        output.message = 'تم تسجيل الدخول بنجاح';
        output.user = authResult.user;
      } else {
        output.status = 'error';
        output.message = authResult.message;
      }
    } else if (action === 'getEmployees') {
      output.data = getSheetData(ss, SHEETS.EMPLOYEES);
    } else if (action === 'getAttendance') {
      var allAtt = getSheetData(ss, SHEETS.ATTENDANCE);
      if (params.date) {
        output.data = allAtt.filter(function(r) { return r.date === params.date; });
      } else {
        output.data = allAtt;
      }
    } else if (action === 'getLeaves') {
      output.data = getSheetData(ss, SHEETS.LEAVES);
    } else if (action === 'getPermissions') {
      output.data = getSheetData(ss, SHEETS.PERMISSIONS);
    } else if (action === 'getUsers') {
      output.data = getSanitizedUsers(ss);
    } else if (action === 'ping') {
      output.message = 'Server is running and connected successfully!';
      output.spreadsheetName = ss.getName();
    } else {
      output.status = 'error';
      output.message = 'Unknown GET action: ' + action;
    }
  } catch (err) {
    output.status = 'error';
    output.message = err.toString();
  }

  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle POST Requests
 */
function doPost(e) {
  var output = { status: 'success', timestamp: new Date().toISOString() };

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

    if (action === 'login') {
      var username = (postData.username || (payload && payload.username) || '').trim().toLowerCase();
      var password = (postData.password || (payload && payload.password) || '').trim();
      var authResult = authenticateUser(ss, username, password);
      
      if (authResult.success) {
        output.status = 'success';
        output.message = 'تم تسجيل الدخول بنجاح';
        output.user = authResult.user;
      } else {
        output.status = 'error';
        output.message = authResult.message;
      }
    } else if (action === 'syncAll' && payload) {
      if (payload.employees && Array.isArray(payload.employees)) setSheetData(ss, SHEETS.EMPLOYEES, payload.employees);
      if (payload.attendance && Array.isArray(payload.attendance)) setSheetData(ss, SHEETS.ATTENDANCE, payload.attendance);
      if (payload.leaves && Array.isArray(payload.leaves)) setSheetData(ss, SHEETS.LEAVES, payload.leaves);
      if (payload.users && Array.isArray(payload.users)) setSheetData(ss, SHEETS.USERS, payload.users);
      if (payload.permissions && Array.isArray(payload.permissions)) setSheetData(ss, SHEETS.PERMISSIONS, payload.permissions);
      if (payload.settings) saveSettingsData(ss, payload.settings);
      if (payload.auditLogs && Array.isArray(payload.auditLogs)) setSheetData(ss, SHEETS.AUDIT_LOGS, payload.auditLogs);
      output.message = 'Full synchronization completed successfully!';
    } else if (action === 'saveAttendance' && payload) {
      upsertAttendanceRecord(ss, payload);
      output.message = 'Attendance record saved successfully!';
    } else if (action === 'bulkSaveAttendance' && payload && Array.isArray(payload)) {
      payload.forEach(function(rec) {
        upsertAttendanceRecord(ss, rec);
      });
      output.message = 'Bulk attendance (' + payload.length + ' records) saved successfully!';
    } else if (action === 'deleteAttendance' && payload && payload.id) {
      deleteRecord(ss, SHEETS.ATTENDANCE, 'id', payload.id);
      output.message = 'Attendance record deleted successfully!';
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
    } else if (action === 'savePermission' && payload) {
      upsertRecord(ss, SHEETS.PERMISSIONS, 'id', payload);
      output.message = 'Permission record saved successfully!';
    } else if (action === 'deletePermission' && payload && payload.id) {
      deleteRecord(ss, SHEETS.PERMISSIONS, 'id', payload.id);
      output.message = 'Permission record deleted successfully!';
    } else if (action === 'saveUser' && payload) {
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
    } else {
      output.status = 'error';
      output.message = 'Unknown POST action: ' + action;
    }
  } catch (err) {
    output.status = 'error';
    output.message = err.toString();
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
      department: 'الإدارة العامة',
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
    var uName = String(u.username || u.Username || u.User_Name || '').trim().toLowerCase();
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
  var status = String(matchedUser.status || matchedUser.Status || 'Active').trim();
  var isActive = (matchedUser.isActive === true || matchedUser.isActive === 'true' || matchedUser.isActive === undefined);
  if (status.toLowerCase() === 'inactive' || status.toLowerCase() === 'disabled' || status === 'معطل' || !isActive) {
    return { success: false, message: 'هذا الحساب غير مفعل حالياً. يرجى مراجعة مدير النظام.' };
  }

  // Check Password (supports plain text or SHA-256 hash)
  var storedPassword = String(matchedUser.password || matchedUser.Password || '').trim();
  var inputHashed = hashStringSHA256(inputPassword);

  var passwordMatches = (storedPassword === inputPassword) || (storedPassword === inputHashed);

  if (!passwordMatches) {
    return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة.' };
  }

  // Update lastLogin in sheet
  try {
    var sheet = ss.getSheetByName(SHEETS.USERS);
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var lastLoginCol = headers.indexOf('lastLogin') + 1;
    if (lastLoginCol > 0 && userRowIndex > 0) {
      var nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
      sheet.getRange(userRowIndex, lastLoginCol).setValue(nowStr);
    }
  } catch (e) {}

  // Return clean sanitized user without password
  var sanitized = {
    id: String(matchedUser.id || matchedUser.User_ID || matchedUser.userId || '001'),
    username: String(matchedUser.username || matchedUser.Username || inputUsername),
    fullName: String(matchedUser.fullName || matchedUser.Full_Name || matchedUser.name || 'مستخدم النظام'),
    role: String(matchedUser.role || matchedUser.Role || 'HR'),
    status: status,
    department: String(matchedUser.department || matchedUser.Department || ''),
    employeeId: String(matchedUser.employeeId || matchedUser.Employee_ID || ''),
    lastLogin: new Date().toISOString()
  };

  return { success: true, user: sanitized };
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
    Monthly_Summary: ['year', 'month', 'employeeId', 'employeeName', 'department', 'presentDays', 'lateDays', 'absentDays', 'totalLateMinutes', 'totalWorkingHours', 'leaveDays'],
    Annual_Summary: ['year', 'employeeId', 'employeeName', 'department', 'jobTitle', 'attendanceRate', 'totalLateMinutes', 'remainingLeaves']
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
        var initialUserRow = ['001', 'admin', 'admin123', 'مدير النظام', 'Admin', 'Active', 'الإدارة العامة', 'EMP001', nowStr, ''];
        sheet.appendRow(initialUserRow);
      }
    } else {
      // If sheet already exists, verify that essential columns exist (especially 'password' in Users)
      var lastCol = sheet.getLastColumn();
      var lastRow = sheet.getLastRow();

      if (lastCol === 0 || lastRow === 0) {
        var headers = sheetDefinitions[name];
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        styleHeaderRow(sheet, headers.length);
        if (name === 'Users') {
          var nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
          var initialUserRow = ['001', 'admin', 'admin123', 'مدير النظام', 'Admin', 'Active', 'الإدارة العامة', 'EMP001', nowStr, ''];
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

/**
 * Ensures the Users sheet has a dedicated 'password' column
 */
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

  // If password column is missing in Users sheet, add it right after username or at the end
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
    // If it's a password column and empty/undefined on update, keep existing password
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
