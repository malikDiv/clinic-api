# Clinic API — نظام إدارة العيادات

REST API كامل لإدارة عيادة طبية: مستخدمون بأربعة أدوار، تخصصات وعيادات، أطباء وبرامج دوام، حجز مواعيد مع منع التعارض وقائمة انتظار، سجلات طبية مع مساعد ذكاء اصطناعي، ولوحة تحكم إحصائية.

مبني بـ **NestJS 12 + TypeORM + MySQL/MariaDB** بصيغة **ESM** (نمط قوالب Nest 12 الحديثة).

---

## 1. التقنيات المستخدمة

| التقنية | الإصدار | الاستخدام |
|---|---|---|
| NestJS | 12 | إطار العمل (Modules / Controllers / Services / Guards) |
| TypeORM | 1.1 | ORM + معاملات + أقفال pessimistic |
| MySQL / MariaDB | 3306 | قاعدة البيانات `clinic_db` |
| TypeScript | 6 | ESM (`"type": "module"`) + Decorators |
| passport-jwt + bcrypt | — | مصادقة JWT وتشفير كلمات المرور |
| class-validator / class-transformer | — | التحقق من DTOs + التحويل |
| @google/genai | 2.30 | ملخصات طبية بالذكاء الاصطناعي (Gemini) |
| Swagger | — | توثيق تفاعلي على `/api` |
| Jest 30 + ts-jest + Supertest | — | اختبارات وحدة (21 مجموعة) + e2e |
| oxlint + prettier | — | فحص الجودة والتنسيق |

---

## 2. بنية المشروع

```text
clinic-api/
├─ src/
│  ├─ main.ts                  # نقطة البداية: Swagger + ValidationPipe + static uploads
│  ├─ app.module.ts            # TypeORM (clinic_db) + استيراد كل الموديولات
│  ├─ auth/                    # register / login + JwtStrategy + JwtAuthGuard
│  ├─ users/                   # إدارة المستخدمين والأدوار
│  ├─ specialties/             # التخصصات الطبية
│  ├─ clinics/                 # العيادات
│  ├─ doctors/                 # ملفات الأطباء + رفع الصور
│  ├─ doctor-schedules/        # برامج دوام الأطباء
│  ├─ appointments/            # المواعيد (معاملات + تعارض + قائمة انتظار)
│  ├─ medical-records/         # السجلات الطبية
│  ├─ ai/                      # توليد الملخصات عبر Gemini
│  └─ dashboard/               # إحصائيات لوحة التحكم
├─ test/                       # اختبار e2e
├─ docs/                       # وثائق التصميم الأصلية
├─ uploads/doctors/            # صور الأطباء المرفوعة
├─ .env                        # JWT_SECRET + GEMINI_API_KEY
└─ package.json
```

---

## 3. الإعداد والتشغيل

### المتطلبات
- Node.js 22 أو أحدث
- MySQL أو MariaDB يعمل على المنفذ **3306**
- قاعدة بيانات باسم `clinic_db` (utf8mb4)

```sql
CREATE DATABASE IF NOT EXISTS clinic_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

> الجداول تُنشأ تلقائياً عند أول تشغيل (`synchronize: true` — مناسبة للتطوير فقط).

إعدادات اتصال قاعدة البيانات مضبوطة في `src/app.module.ts`: المضيف `localhost`، المنفذ `3306`، المستخدم `root`، بدون كلمة مرور.

### متغيرات البيئة (`.env`)

| المتغير | الوصف | ملاحظة |
|---|---|---|
| `JWT_SECRET` | سر توقيع توكن JWT | مُضبوط |
| `GEMINI_API_KEY` | مفتاح Google Gemini | **placeholder حالياً — استبدله بمفتاح حقيقي**، بدونه سيفشل توليد الملخصات |

### الأوامر

```powershell
npm install          # تثبيت الحزم (مرة واحدة)

npm run start:dev    # تشغيل تطويري مع إعادة التحميل التلقائي
npm run build        # بناء إلى dist/
npm run start:prod   # تشغيل نسخة الإنتاج (بعد build)

npm test             # اختبارات الوحدة (21 مجموعة)
npm run test:e2e     # اختبار e2e شامل مع قاعدة البيانات
npm run lint         # فحص oxlint
npm run format       # تنسيق prettier
```

- **API:** http://localhost:3000
- **Swagger:** http://localhost:3000/api
- **ملفات الصور المرفوعة:** http://localhost:3000/uploads/doctors/<filename>

### إنشاء أول حساب مدير

`POST /auth/register` يفرض دور `patient` دائماً (لأمان المنصة)، لذا:

1. سجّل حساباً عادياً عبر Swagger: `POST /auth/register` ببيانات المدير.
2. رقِّ الحساب من قاعدة البيانات:

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@clinic.local';
```

3. أعد تسجيل الدخول — التوكن الجديد يحمل `role: admin`.
4. من الآن، المدير ينشئ بقية الحسابات عبر `POST /users` (طبيب: `role=doctor` ثم ملفه المهني عبر `POST /doctors`؛ استقبال: `role=receptionist`).

### حسابات تجريبية جاهزة (بيانات اختبار الدخان)

| الدور | البريد | كلمة المرور |
|---|---|---|
| admin | `smoke.admin@clinic.com` | `StrongPass123!` |
| doctor | `smoke.doctor@clinic.com` | `DoctorPass123!` |
| patient | `smoke.patient@clinic.com` | `PatientPass123!` |

---

## 4. المصادقة والأدوار

- كل المسارات المحمية تتطلب ترويسة: `Authorization: Bearer <token>`
- التوكن JWT يحمل الحمولة: `{ sub: userId, email, role }` وينتهي بعد ساعة (`expiresIn: 1h`).
- الحماية على طبقتين: `JwtAuthGuard` على المسار (رفع 401) + `checkRole(currentUser, allowed)` داخل الخدمة (رفع 403).

| الدور | القيمة | من ينشئه |
|---|---|---|
| مدير | `admin` | ترقية يدوية عبر SQL (أول مدير) ثم `POST /users` |
| طبيب | `doctor` | المدير عبر `POST /users` + `POST /doctors` |
| استقبال | `receptionist` | المدير عبر `POST /users` |
| مريض | `patient` | تسجيل ذاتي `POST /auth/register` (الدور مفروض دائماً) |

---

## 5. الاتفاقيات العامة

- **شكل الأخطاء:** `{ "statusCode": 409, "message": "..." }`
  - `400` فشل تحقق المدخلات · `401` توكن مفقود/منتهي · `403` دور غير مسموح · `404` غير موجود · `409` تعارض أو حالة غير صالحة.
- **ValidationPipe:** `whitelist` + `forbidNonWhitelisted` — أي حقل غير معروف في الطلب يرفض بـ 400.
- **كلمات المرور:** لا تُعاد أبداً في أي استجابة (تُنقى داخل الخدمات).
- **الصيغ:** التاريخ `YYYY-MM-DD`، الوقت `HH:mm`، الهاتف `09XXXXXXXX`، كلمة المرور قوية إلزامياً.
- **الرفع:** `POST /doctors` يقبل `multipart/form-data` مع حقل ملف اختياري `photo` (تُخزن في `uploads/doctors/`).

---

## 6. نقاط النهاية (Endpoints)

### 6.1 الفحص العام

| الطريقة | المسار | الوصول | الوصف |
|---|---|---|---|
| GET | `/` | عام | فحص بسيط: `Hello World!` |

### 6.2 المصادقة — `/auth`

| الطريقة | المسار | الوصول | الطلب | الاستجابة |
|---|---|---|---|---|
| POST | `/auth/register` | عام | `{name, email, phone, password, age?}` | `{message, user{id,name,email,phone,role}, token}` — الدور دائماً `patient` (409 إذا البريد مكرر) |
| POST | `/auth/login` | عام | `{email, password}` | `{message, user, token}` (401 بيانات خاطئة) |

### 6.3 المستخدمون — `/users` (كلها JWT)

| الطريقة | المسار | الوصول | الوصف |
|---|---|---|---|
| POST | `/users` | admin | إنشاء أي حساب `{name, email, phone, password, role, age?}` (409 بريد مكرر) |
| GET | `/users` | admin | كل المستخدمين بدون كلمات مرور |
| PATCH | `/users/me` | أي مستخدم | تعديل ملفه الشخصي (حقل `role` يُتجاهل — لا تصعيد صلاحيات) |
| GET | `/users/:id` | admin أو صاحب الحساب | عرض مستخدم |
| PATCH | `/users/:id` | admin | تعديل أي حقول بما فيها `role` وكلمة المرور |
| DELETE | `/users/:id` | admin | حذف آمن: يزيل أولاً المواعيد والسجلات والدوام وملف الطبيب المرتبط، ثم المستخدم |

### 6.4 التخصصات — `/specialties`

| الطريقة | المسار | الوصول | الوصف |
|---|---|---|---|
| POST | `/specialties` | admin | `{name, description?}` |
| GET | `/specialties` | عام | القائمة |
| GET | `/specialties/:id` | عام | تفاصيل (404 إن لم يوجد) |
| PATCH | `/specialties/:id` | admin | تعديل |
| DELETE | `/specialties/:id` | admin | حذف |

### 6.5 العيادات — `/clinics`

بنفس نمط التخصصات: `POST/PATCH/DELETE` للمدير فقط، و`GET` (القائمة و `/:id`) عام. الحقول: `{name, address, phone}`.

### 6.6 الأطباء — `/doctors`

| الطريقة | المسار | الوصول | الوصف |
|---|---|---|---|
| POST | `/doctors` | admin | `multipart/form-data`: `userId, specialtyId, clinicId, consultationFee, experienceYears?, bio?, photo?` — يتحقق: المستخدم موجود ودوره `doctor` (409)، التخصص والعيادة موجودان (404)، لا يوجد ملف طبيب مسبق لنفس المستخدم (409) |
| GET | `/doctors` | عام | بحث باستعلام: `?specialtyId=&clinicId=&maxFee=` |
| GET | `/doctors/me/profile` | doctor | ملف الطبيب لصاحب التوكن |
| GET | `/doctors/:id` | عام | تفاصيل طبيب (مع المستخدم والتخصص والعيادة) |
| PATCH | `/doctors/:id` | admin أو الطبيب نفسه | admin: كل الحقول؛ الطبيب: `bio` و `experienceYears` فقط |
| DELETE | `/doctors/:id` | admin | حذف |

### 6.7 برامج الدوام — `/doctor-schedules`

| الطريقة | المسار | الوصول | الوصف |
|---|---|---|---|
| POST | `/doctor-schedules` | admin أو الطبيب صاحب الدوام | `{doctorId, clinicId, dayOfWeek 0-6, startTime, endTime}` — 409: يوم خارج 0-6، بداية ≥ نهاية، أو تداخل مع دوام آخر لنفس الطبيب في نفس اليوم |
| GET | `/doctor-schedules/doctor/:doctorId` | عام | كل دوامات طبيب |
| GET | `/doctor-schedules/:id` | عام | تفاصيل |
| PATCH | `/doctor-schedules/:id` | admin أو الطبيب صاحب الدوام | نفس فحوصات الإنشاء |
| DELETE | `/doctor-schedules/:id` | admin أو الطبيب صاحب الدوام | حذف |

> `dayOfWeek`: 0=الأحد … 6=السبت (مطابق لـ `Date.getDay()`).

### 6.8 المواعيد — `/appointments` (كلها JWT)

| الطريقة | المسار | الوصول | الوصف |
|---|---|---|---|
| POST | `/appointments` | admin, receptionist, patient | `{doctorId, date, time, notes?, patientId?}` — المريض لنفسه تلقائياً، والموظف يجب أن يمرر `patientId` (409 إن غاب). ينشئ موعداً **confirmed** برسم تلقائي من `consultationFee` وحالة دفع `unpaid` |
| POST | `/appointments/waiting` | admin, receptionist, patient | نفس الحقول → موعد بحالة **waiting** (409 لطلب انتظار مكرر لنفس المريض/الطبيب/الوقت) |
| GET | `/appointments` | admin, receptionist | كل المواعيد |
| GET | `/appointments/my` | patient | مواعيد المريض الحالي مرتبة تنازلياً |
| GET | `/appointments/doctor` | admin, receptionist, doctor | الطبيب يستخدم توكنه مباشرة؛ الموظف يمرر `?doctorId=` (409 إن غاب)، ويمكن فلترة `?date=` |
| GET | `/appointments/waiting/list` | admin, receptionist, doctor | قائمة انتظار لطبيب/تاريخ (`?doctorId=&date=` مطلوبان) مرتبة بالأقدمية |
| GET | `/appointments/patient/:patientId` | حسب الصلاحية | المريض لنفسه فقط، وإلا admin/receptionist/doctor |
| GET | `/appointments/:id` | حسب الصلاحية | المريض يرى مواعيده فقط، والطبيب مواعيده فقط |
| PATCH | `/appointments/:id/status` | حسب آلة الحالات | `{status}` — انظر القسم 7.3 |
| PATCH | `/appointments/:id` | admin, receptionist | `{paymentStatus?: "unpaid"\|"paid", notes?}` |
| DELETE | `/appointments/:id` | admin | حذف الموعد |

### 6.9 السجلات الطبية — `/medical-records` (كلها JWT)

| الطريقة | المسار | الوصول | الوصف |
|---|---|---|---|
| POST | `/medical-records` | doctor | `{appointmentId, diagnosis, notes}` — الموعد يجب أن يكون **completed** ويخص هذا الطبيب (403)، وسجل واحد فقط لكل موعد (409) |
| GET | `/medical-records/my` | patient | سجلات المريض الحالي |
| GET | `/medical-records/patient/:patientId` | patient (نفسه) أو admin/receptionist/doctor | يعيد `{patient, records[]}` |
| GET | `/medical-records/:id` | حسب الصلاحية | المريض سجلاته فقط، والطبيب سجلاته فقط |
| PATCH | `/medical-records/:id/ai-summary/approve` | doctor صاحب السجل | `{summary}` — يحفظ الملخص ويعتمدّه (`aiSummaryApproved = 1`) |
| PATCH | `/medical-records/:id` | doctor صاحب السجل | `{diagnosis?, notes?}` |

### 6.10 الذكاء الاصطناعي — `/ai` (JWT)

| الطريقة | المسار | الوصول | الوصف |
|---|---|---|---|
| POST | `/ai/medical-summary` | doctor صاحب السجل | `{recordId}` → يعيد `{recordId, summary}` ملخصاً مقترحاً **دون حفظ** — الحفظ والاعتماد عبر نقطة `approve` |

### 6.11 لوحة التحكم — `/dashboard` (JWT)

| الطريقة | المسار | الوصول | الوصف |
|---|---|---|---|
| GET | `/dashboard/summary` | admin | ملخص إحصائي (انظر القسم 7.5) |

---

## 7. قواعد العمل المهمة

### 7.1 حجز موعد (`POST /appointments`)

يُنفَّذ داخل **معاملة قاعدة بيانات** (`transaction`) مع **أقفال كتابة متشائمة** (`pessimistic_write`) على صف المريض وصف الطبيب لمنع الحجز المزدوج تحت التزامن:

1. التحقق من وجود المريض والطبيب (404).
2. **تغطية الدوام:** يجب أن يملك الطبيب دواماً في نفس يوم الأسبوع للتاريخ المطلوب، وأن يقع الوقت ضمن الفترة `[startTime, endTime)`.
3. **منع التعارض:**
   - لا يوجد موعد (confirmed/completed) لنفس الطبيب في نفس التاريخ والوقت → 409.
   - لا يوجد موعد لنفس المريض في نفس الوقت → 409.
4. الحقول التلقائية: `status = confirmed`، `fee = doctor.consultationFee`، `paymentStatus = unpaid`.

### 7.2 قائمة الانتظار

- عند امتلاء الوقت، يُنشئ المريض طلب انتظار: `POST /appointments/waiting` → حالة `waiting`.
- **الترقية:** عند إلغاء موعد أو توفر الوقت، يقوم admin/receptionist بـ `PATCH /appointments/:id/status` بحالة `confirmed`، فتُنفَّذ `confirmAppointment` في معاملة وأقفال منفصلة، مع:
  - رفض الترقية إذا مضى وقت الموعد → 409 `انتهى وقت هذا الموعد`.
  - إعادة فحص تغطية الدوام وتوفر الوقت قبل التثبيت.
  - الترقية متاحة فقط للمواعيد بحالة `waiting`.

### 7.3 آلة حالات الموعد

| من | إلى | من يستطيع تنفيذها | الشروط |
|---|---|---|---|
| `waiting` | `confirmed` | admin, receptionist | عبر الترقية + فحوص الوقت والتوفر |
| `waiting` | `cancelled` | patient (صاحب الموعد), doctor (صاحب الموعد), admin, receptionist | — |
| `confirmed` | `completed` | doctor (صاحب الموعد), admin, receptionist | — |
| `confirmed` | `cancelled` | patient (صاحب الموعد), doctor (صاحب الموعد), admin, receptionist | — |
| `completed` / `cancelled` | — | — | حالة نهائية، أي تغيير → 409 |
| أي انتقال آخر | — | — | 409 (`انتقال حالة غير صالح`) |

> المريض مقيّد بإلغاء موعده فقط، والطبيب بإكمال أو إلغاء مواعيده فقط.

### 7.4 السجلات الطبية والذكاء الاصطناعي

- السجل الطبي يُنشأ **فقط** بعد إتمام الزيارة (موعد بحالة `completed`) وبواسطة طبيب الموعد نفسه، وسجل واحد لكل موعد.
- **توليد الملخص:** `POST /ai/medical-summary` يبني طلباً من ملاحظات السجل، ويستدعي نموذج `gemini-3.8-flash` (إعدادات: تفكير منخفض، حرارة 0.3، حد 400 توكن):
  - عند خطأ `503` يعاد المحاولة بعد 3 ثوانٍ ثم 6 ثوانٍ، ثم يتحول تلقائياً إلى النموذج الاحتياطي `gemini-3.5-flash-lite`.
  - إن فشل كل ذلك → 500 `خدمة الذكاء الاصطناعي غير متاحة حالياً`.
- **الاعتماد:** الطبيب يراجع الملخص ثم يحفظه عبر `PATCH /medical-records/:id/ai-summary/approve` (يمكنه تعديل النص قبل الاعتماد).

### 7.5 لوحة التحكم (`GET /dashboard/summary` — admin)

| الحقل | المعنى |
|---|---|
| `totalAppointments` | إجمالي المواعيد |
| `appointmentsByStatus` | توزيع المواعيد: `{waiting, confirmed, completed, cancelled}` |
| `todayAppointments` | مواعيد اليوم |
| `totalPatients` | عدد المرضى (role = patient) |
| `totalDoctors` | عدد الأطباء |
| `revenue` | `{totalPaid, paidAppointments, pendingAmount}` — `totalPaid`: مجموع رسوم المواعيد المدفوعة، `paidAppointments`: عددها، `pendingAmount`: مجموع رسوم المواعيد **المكتملة غير المدفوعة** |
| `topDoctors` | أعلى 5 أطباء بعدد المواعيد: `[{doctorId, name, appointmentsCount}]` |

---

## 8. الاختبارات

| الأمر | المحتوى |
|---|---|
| `npm test` | 21 مجموعة اختبار وحدة (Controller + Service لكل موديول) بمزيفات `getRepositoryToken` و DataSource بدون قاعدة بيانات |
| `npm run test:e2e` | اختبار تكامل يشغّل التطبيق كاملاً (يتصل بقاعدة البيانات الحقيقية) |

> المشروع ESM بالكامل، لذا تعمل سكربتات Jest عبر `node --experimental-vm-modules` مع `ts-jest` بوضع ESM — وهذا مضبوط مسبقاً في `package.json` و `test/jest-e2e.json`.

---

## 9. ملاحظات تقنية

- **ESM خالص:** المشروع `"type": "module"` وكل الاستيرادات النسبية تنتهي بـ `.js` (متطلب Node ESM) — حزم NestJS 12 نفسها ESM-only.
- **`Relation<T>`:** خصائص علاقات ManyToOne في الكيانات تستخدم النوع `Relation<T>` من TypeORM لمنع انهيار الاستيراد الدائري بين الكيانات مع `emitDecoratorMetadata` في ESM (الـ metadata تُصدِّر `Object` بدل مرجع الكلاس).
- **`synchronize: true`** مناسبة للتطوير فقط — للإنتاج استخدم migrations.
- **Gemini:** يجب تعيين `GEMINI_API_KEY` حقيقي في `.env`؛ بدونه سيعمل التطبيق لكن ستُرفض طلبات `POST /ai/medical-summary` (المفتاح الحالي placeholder).
- **الرسوم** تُخزَّن بدقة `decimal(10,2)` وتُعاد كنص (سلوك mysql2 مع decimals).

---

## 10. خارطة الأخطاء الشائعة

| الرمز | المعنى الشائع |
|---|---|
| 400 | فشل تحقق DTO (حقل ناقص/صيغة غير صحيحة/حقل غير معروف) |
| 401 | توكن مفقود أو منتهي — أعد تسجيل الدخول |
| 403 | دورك غير مسموح لهذه العملية |
| 404 | الكيان غير موجود (طبيب/مريض/موعد/سجل...) |
| 409 | بريد مكرر · تعارض وقت · خارج دوام الطبيب · طلب انتظار مكرر · انتقال حالة غير صالح · إنشاء سجل لموعد غير مكتمل |
