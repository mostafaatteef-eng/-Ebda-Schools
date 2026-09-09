# توثيق أرشفة الوحدات المتقاعدة (RETIRED MODULES ARCHIVE)
## Migration Reference: `MIG_SCOPE_008_REMOVE_SAMAT_PAYROLL`
### تاريخ الإجراء: 2026-09-09

بناءً على القرار الإداري النهائي بتقليص نطاق نظام إدارة المدارس وتفريغه للوظائف التشغيلية المدرسية الأساسية للكوادر المدرسية فقط (Staff-Only School ERP)، تم رسمياً تفكيك وأرشفة منظومتي:
1. **منظومة سمات لبناء الشخصية والمهارات (SAMAT Module)**
2. **محرك الرواتب ومسير الاستحقاقات (Payroll Engine & Run)**

---

## 1. منظومة سمات (SAMAT Module)

### جدول العناصر والمكونات المؤرشفة:
- **المكونات المرئية (UI Views):**
  - `SamatFoundationView.tsx` (لوحة التأسيس والإعدادات العامة لسمات)
  - `SamatCurriculumManager.tsx` (إدارة مناهج وحصص سمات)
  - `SamatDeliveryManager.tsx` (جدولة وتقديم حصص سمات)
  - `SamatAssessmentManager.tsx` (تقييمات مهارات سمات)
  - `SamatSessionAttendanceModal.tsx` (حضور حصص سمات)
  - `SamatStudentProfileTab.tsx` (تبويب سمات في ملف الطالب)
  - `SamatStudentBehaviorTab.tsx` (تبويب سلوك سمات الموسع)
- **الخدمات الخلفية ومنطق العمل (Services & Core Logic):**
  - `samatService.ts`
  - `healthCheck.ts`
  - `samatTestService.ts`
  - `timelineService.ts`
  - `curriculumValidator.ts`
  - `migrations.ts`
  - `permissions.ts`
- **الشيتات وقواعد البيانات المرتبطة (Spreadsheet & DB Entities):**
  - `SAMAT_Programs`
  - `SAMAT_Program_Grades`
  - `SAMAT_Competencies`
  - `SAMAT_Rubrics`
  - `SAMAT_Rubric_Levels`
  - `SAMAT_Role_Assignments`
  - `SAMAT_Score_Definitions`
  - `SAMAT_Score_Versions`
  - `SAMAT_Sessions`
  - `SAMAT_Attendance`
  - `SAMAT_Assessments`
  - `SAMAT_Evidence`
  - `SAMAT_Appeals`
  - `SAMAT_PDP`
  - `SAMAT_Mentoring`
  - `SAMAT_Challenges`
  - `SAMAT_Portfolio`
- **مفاتيح التخزين المحلي (LocalStorage Keys):**
  - `ntss_samat_programs_v1`, `ntss_samat_program_grades_v1`, `ntss_samat_competencies_v1`, `ntss_samat_rubrics_v1`, `ntss_samat_rubric_levels_v1`, `ntss_samat_role_assignments_v1`, `ntss_samat_score_definitions_v1`, `ntss_samat_score_versions_v1`, `ntss_samat_migrations_v1`, `ntss_samat_settings_v1`, `ntss_samat_sessions_v1`, `ntss_samat_attendance_v1`, `ntss_samat_assessments_v1`, `ntss_samat_evidence_v1`, `ntss_samat_appeals_v1`, `ntss_samat_pdp_v1`, `ntss_samat_mentoring_v1`, `ntss_samat_challenges_v1`, `ntss_samat_portfolio_v1`
- **الأدوار الملغاة (Retired Roles):**
  - `SamatLeader`
  - `SAMAT_LEADER`
  - `SAMAT_FACILITATOR`
  - `SAMAT_MENTOR`
- **الصلاحيات الملغاة (Retired Permissions):**
  - `samat.*` (جميع صلاحيات المناهج، التقييم، الجلسات، التوجيه، التحديات، الاعتماد)

---

## 2. محرك الرواتب ومسير الاستحقاقات (Payroll Engine)

### جدول العناصر والمكونات المؤرشفة:
- **المكونات المرئية (UI Views):**
  - `PayrollView.tsx` (شاشة مسير الرواتب الشهرية والاحتساب المالي)
  - `FinancialRulesTab.tsx -> subSection: 'payroll_rules'` (إعدادات الرواتب، التأمينات، وساعات العمل الإضافي)
  - مودال تعديل الراتب وسجل السريان في شاشة الموظفين (`EmployeesView.tsx`)
  - كارت حالة مسير الرواتب في لوحة تحكم الإدارة (`AdminDashboard.tsx`)
- **الخدمات والعمليات المالية:**
  - `HRPayrollService.calculateEmployeePayrollBreakdown`
  - `HRPayrollService.generateMonthlyPayrollFromSnapshots`
  - `HRPayrollService.approvePayroll` / `lockPayroll`
  - تقارير الرواتب في `ReportService` (`payroll_summary`, `payroll_snapshot_audit`)
- **الشيتات ومفاتيح التخزين (Spreadsheet & DB Entities):**
  - شيت `Payroll` (SHEETS.PAYROLL)
  - مفاتيح: `ntss_payroll_v3`, `ntss_payroll_snapshots_v3`, `ntss_salary_history_v3`
- **الأدوار والصلاحيات الملغاة:**
  - دور `PayrollOfficer` (محاسب الرواتب)
  - صلاحيات `payroll.view`, `payroll.manage`, `payroll.approve`, `payroll.lock`
  - حقول `canViewPayroll`, `canProcessPayroll`, `canApprovePayroll` من بيانات الأدوار والمستخدمين.

---

## 3. الوحدات التشغيلية المعتمدة المستقرة (Preserved Core Modules)

تم فحص والتحقق من بقاء واستقرار كافة الوحدات المدرسية الأساسية:
1. **شؤون الطلاب والقيد المدرسي (Students & Enrollment):** سجلات الطلاب، الملف الشامل، القيد، التسكين، والتحويلات.
2. **حضور وغياب الطلاب (Student Attendance):** التسجيل اليومي، الحصص، مبررات الغياب، والإنذارات.
3. **السلوك والدعم الاجتماعي (Core Behavior Module):** السلوك الإيجابي، المخالفات والجزاءات، خطط التدخل، ومتابعة الأخصائي الاجتماعي (دون أي ربط بسمات).
4. **الموارد البشرية وشؤون الموظفين (HR Management):** سجلات الموظفين والمعلمين، العقود، الحضور والانصراف، الإجازات، وأذونات العمل (مع تجريد الحقول المالية للرواتب).
5. **إقفال الحضور الشهري (Monthly Attendance Closings):** متاح لإقفال وتدقيق سجلات الحضور الشهرية كعملية إدارية مستقلة عن أي مسير مالي.
6. **التقارير والإحصائيات (School Reports):** تقارير الطلاب، الحضور، الإجازات، السلوك، ومعدلات الأداء.
7. **النسخ الاحتياطي والتدقيق والعمليات (Backup, Audit, Operations & Security):** تشغيل كامل بدون أي اعتمادات على سمات أو الرواتب.
