-- Admin Portal (S028) seed data for testing. Mirrors and extends the frontend
-- mock repositories (apps/web/src/data/*/mock.ts) so the app looks realistic in
-- VITE_ADMIN_DATA_SOURCE=supabase mode. Idempotent: re-running is safe.
--
-- Run automatically by `supabase db reset`, or manually:
--   psql "$DATABASE_URL" -f supabase/seed.sql

-- ---- Notification categories (4 G-02 baseline + optional) ------------------

insert into public.notification_categories (id, name, description, statutory, baseline, updated_at) values
  ('cat-results',            'Results',              'Academic results publication notices',                       true,  true,  now() - interval '30 days'),
  ('cat-admission-decisions','Admission Decisions',  'Admissions status changes and decisions (SA.01)',            true,  true,  now() - interval '30 days'),
  ('cat-exam-notices',       'Exam Notices',         'Examination schedules, venues, and notices',                 true,  true,  now() - interval '30 days'),
  ('cat-welfare-safety',     'Welfare Safety Alerts','Safety-critical welfare alerts, content minimised (G-03)',   true,  true,  now() - interval '30 days'),
  ('cat-fees',               'Fees',                 'Fee schedules, due dates, and payment reminders (C-03)',     false, false, now() - interval '12 days'),
  ('cat-library',            'Library',              'Due dates, reservations, and fines from S104',               false, false, now() - interval '12 days'),
  ('cat-hostel',             'Hostel',               'Hostel and hall notices',                                    false, false, now() - interval '12 days'),
  ('cat-scholarships',       'Scholarships',         'Scholarship windows, awards, and rejections (SA.13)',        false, false, now() - interval '12 days'),
  ('cat-society-events',     'Society Events',       'Co-curricular and society activity (SA.14)',                 false, false, now() - interval '12 days')
on conflict (id) do nothing;

-- ---- Notification templates (content-minimised per G-03/NFR-PR2) -----------

insert into public.notification_templates (id, category_id, name, push_title, push_body, inbox_body, updated_at) values
  ('tpl-results',           'cat-results',            'Results available',        'Results',     'Your results are available',                'Your latest results have been published. Open Grades and Transcript to view them.', now() - interval '1 days'),
  ('tpl-admission-decision','cat-admission-decisions','Admission status update',  'Admissions',  'There is an update on your application',     'Your admission status has changed. Open Admissions Status for the decision and next steps.', now() - interval '4 days'),
  ('tpl-exam-notice',       'cat-exam-notices',       'Exam notice published',    'Exam notice', 'A new examination notice has been published','A new examination notice affects your programme. Open Notifications for details.', now() - interval '6 days'),
  ('tpl-welfare-update',    'cat-welfare-safety',     'Welfare update',           'Welfare',     'You have a welfare update',                  'You have an update on your welfare case. Open Welfare to view it securely.', now() - interval '9 days'),
  ('tpl-fee-reminder-7d',   'cat-fees',               'Fee reminder (7 days)',    'Fees',        'A fee payment is due in 7 days',             'A fee payment is due in 7 days. Open Fees and Payments to view your balance.', now() - interval '15 days'),
  ('tpl-fee-reminder-1d',   'cat-fees',               'Fee reminder (1 day)',     'Fees',        'A fee payment is due tomorrow',              'A fee payment is due tomorrow. Open Fees and Payments to complete payment.', now() - interval '15 days'),
  ('tpl-library-due',       'cat-library',            'Library item due',         'Library',     'A borrowed item is due soon',                'A borrowed library item is due soon. Open Library to renew or return it.', now() - interval '10 days'),
  ('tpl-hostel-allocation', 'cat-hostel',             'Hostel allocation notice', 'Hostel',      'There is an update on your hall allocation', 'Your hall allocation has an update. Open Hostel for details.', now() - interval '8 days'),
  ('tpl-scholarship-open',  'cat-scholarships',       'Scholarship window open',  'Scholarships','A scholarship you may qualify for is open',  'A scholarship application window is open. Open Scholarships to check your eligibility.', now() - interval '5 days'),
  ('tpl-society-event',     'cat-society-events',     'Society event',            'Events',      'A new society event has been posted',        'A new society event has been posted. Open Society Events to see what is on.', now() - interval '3 days')
on conflict (id) do nothing;

-- ---- Welfare routing rules (org units only, never a student/case) ----------

insert into public.welfare_routing_rules (id, category, route_to, escalate_to, escalate_after_hours, priority, active, updated_at) values
  ('route-safety',        'safety',            'On-Call Welfare Responder', 'GSL Registrar',           2,  'crisis',   true,  now() - interval '3 days'),
  ('route-counselling',   'counselling',       'Student Counselling Unit',  'Dean of Students Office', 48, 'standard', true,  now() - interval '3 days'),
  ('route-financial',     'financial-hardship','Student Support Office',     'Dean of Students Office', 72, 'standard', true,  now() - interval '20 days'),
  ('route-accommodation', 'accommodation',     'Hostel Welfare Desk',        'Student Support Office',  72, 'standard', false, now() - interval '40 days'),
  ('route-other',         'other',             'Student Support Office',     'Dean of Students Office', 96, 'standard', true,  now() - interval '25 days'),
  ('route-safety-night',  'safety',            'Campus Security Control Room','On-Call Welfare Responder',1, 'crisis',   true,  now() - interval '6 days')
on conflict (id) do nothing;

-- ---- Hostel allocation rules -----------------------------------------------

insert into public.hostel_allocation_rules (id, name, description, priority, applies_to, strategy, reserved_share_percent, active, updated_at) values
  ('hostel-accessibility','Accessibility-need priority', 'Students with registered accessibility needs are placed before any ballot runs', 1, 'all',        'need-based',              10, true,  now() - interval '5 days'),
  ('hostel-firstyear',    'First-year hall reservation', 'Reserved hall share so incoming students can be accommodated on campus',          2, 'first-year', 'random-ballot',           60, true,  now() - interval '5 days'),
  ('hostel-continuing',   'Continuing students ballot',  'Remaining rooms balloted among continuing students',                             3, 'continuing', 'first-come-first-served', 30, false, now() - interval '30 days'),
  ('hostel-merit',        'Merit hall allocation',       'A small merit-based share for students in good standing',                        4, 'continuing', 'merit-based',             10, true,  now() - interval '18 days'),
  ('hostel-finalyear',    'Final-year proximity',        'Final-year students prioritised for halls near the faculty',                     5, 'continuing', 'need-based',              15, false, now() - interval '50 days')
on conflict (id) do nothing;

-- ---- Scholarship windows (one open, one scheduled, one closed, + extras) ----

insert into public.scholarship_windows (id, name, description, min_standing, programmes, years_of_study, opens_at, closes_at, updated_at) values
  ('sch-merit',         'GSL Merit Scholarship', 'Full tuition award for top-performing students across both programmes',          'good_standing', array['LLB','LPT'], array[2,3,4],   now() - interval '10 days', now() + interval '20 days', now() - interval '10 days'),
  ('sch-deans-bursary', 'Deans List Bursary',    'Partial bursary for LLB students on the deans list',                            'good_standing', array['LLB'],       array[2,3,4],   now() + interval '14 days', now() + interval '45 days', now() - interval '3 days'),
  ('sch-access-grant',  'Access Support Grant',  'Needs-based support open to all students in good or satisfactory standing',     'satisfactory',  array['LLB','LPT'], array[1,2,3,4], now() - interval '60 days', now() - interval '5 days',  now() - interval '60 days'),
  ('sch-first-year',    'First-Year Entry Award','Entry award for first-year students across both programmes',                    'any',           array['LLB','LPT'], array[1],       now() - interval '2 days',  now() + interval '30 days', now() - interval '2 days'),
  ('sch-lpt-practice',  'LPT Practice Bursary',  'Support for LPT students entering the practical training year',                 'satisfactory',  array['LPT'],       array[3,4],     now() + interval '30 days', now() + interval '75 days', now() - interval '1 days')
on conflict (id) do nothing;

-- ---- Admissions workflow stages (B-01 applicant chain + rejection branch) --

insert into public.admissions_workflow_stages
  (id, staff_status_key, applicant_label, applicant_description, stage_order, notify_on_enter, terminal, rejection_branch, shows_appeal_rights, updated_at) values
  ('stage-received',       'APPLICATION_RECEIVED','Application received',     'Your application has been received and is awaiting review.',                                          1, true, false, false, false, now() - interval '45 days'),
  ('stage-under-review',   'UNDER_REVIEW',        'Under review',             'Admissions staff are reviewing your application.',                                                    2, true, false, false, false, now() - interval '45 days'),
  ('stage-decision-pending','DECISION_PENDING',   'Decision pending',         'A decision on your application is being finalised.',                                                  3, true, false, false, false, now() - interval '45 days'),
  ('stage-offer-made',     'DECISION_MADE',       'Offer made',               'An offer has been made. Review it and respond with your decision.',                                   4, true, false, false, false, now() - interval '45 days'),
  ('stage-offer-accepted', 'OFFER_ACCEPTED',      'Offer accepted',           'You have accepted your offer. Enrolment is being finalised.',                                         5, true, false, false, false, now() - interval '45 days'),
  ('stage-enrolled',       'ENROLLED',            'Enrolled',                 'You are enrolled. The full student app suite is now available to you.',                               6, true, true,  false, false, now() - interval '45 days'),
  ('stage-rejected',       'DECISION_MADE',       'Application unsuccessful', 'Your application was not successful this time. The decision and your appeal rights are shown with it.',7, true, true,  true,  true,  now() - interval '45 days')
on conflict (id) do nothing;

-- ---- App releases (across governance statuses) -----------------------------

insert into public.app_releases
  (id, version, summary, platforms, statutory_impacting, status, wcag_status, wcag_auditor, wcag_report_ref, wcag_completed_at, approved_by, approved_at, created_at, updated_at) values
  ('rel-1.5.0', '1.5.0', 'Fee instalment plan display and payment reminder changes (SA.09)',        array['ios','android'], true,  'draft',             'pending', null,                 null,             null,                        null,          null,                     now() - interval '2 days',  now() - interval '2 days'),
  ('rel-1.4.0', '1.4.0', 'Welfare crisis pathway improvements and enhanced SA.12 accessibility',    array['ios','android'], true,  'awaiting-approval', 'passed',  'Accessible Ghana Ltd','WCAG-2026-014', now() - interval '6 days',    null,          null,                     now() - interval '14 days', now() - interval '6 days'),
  ('rel-1.3.2', '1.3.2', 'Timetable sync fixes and library barcode caching (SA.02, SA.11)',         array['android'],       false, 'released',          'passed',  'Accessible Ghana Ltd','WCAG-2026-011', now() - interval '40 days',   'CLET DG',     now() - interval '38 days',now() - interval '50 days', now() - interval '35 days'),
  ('rel-1.5.1', '1.5.1', 'Push notification reliability fixes (SA.08)',                             array['ios','android'], false, 'wcag-audit',        'pending', null,                 null,             null,                        null,          null,                     now() - interval '1 days',  now() - interval '1 days'),
  ('rel-1.2.0', '1.2.0', 'Initial scholarships module and eligibility pre-filter (SA.13)',          array['ios','android'], true,  'approved',          'passed',  'Accessible Ghana Ltd','WCAG-2026-006', now() - interval '80 days',   'CLET DG',     now() - interval '78 days',now() - interval '90 days', now() - interval '78 days')
on conflict (id) do nothing;

-- ---- Audit events (config changes + release events, newest first) ----------

insert into public.audit_events (occurred_at, actor, area, action, summary, reference) values
  (now() - interval '1 days',  'GSL Student Support Administrator', 'notifications',      'template.updated',        'Updated the Results notification template',                     'tpl-results'),
  (now() - interval '2 days',  'GSL Student Support Administrator', 'scholarships',        'window.opened',           'Opened the GSL Merit Scholarship application window',           'sch-merit'),
  (now() - interval '3 days',  'GSL Student Support Administrator', 'welfare-routing',     'rule.updated',            'Changed the escalation target for counselling referrals',       'route-counselling'),
  (now() - interval '5 days',  'GSL Student Support Administrator', 'hostel-rules',        'rule.created',            'Added a first-year priority rule for hall allocation',          'hostel-firstyear'),
  (now() - interval '6 days',  'GSL Student Support Administrator', 'notifications',      'template.created',        'Added the Society event notification template',                 'tpl-society-event'),
  (now() - interval '8 days',  'GSL Student Support Administrator', 'releases',            'release.submitted',       'Submitted app release 1.4.0 for WCAG audit',                    'rel-1.4.0'),
  (now() - interval '12 days', 'GSL Student Support Administrator', 'admissions-workflow', 'stage.updated',           'Updated the "Offer made" admissions stage presentation',        'stage-offer-made'),
  (now() - interval '18 days', 'GSL Student Support Administrator', 'hostel-rules',        'rule.created',            'Added a merit hall allocation rule',                            'hostel-merit'),
  (now() - interval '25 days', 'GSL Student Support Administrator', 'welfare-routing',     'rule.created',            'Added an "other" welfare routing rule',                         'route-other'),
  (now() - interval '38 days', 'CLET DG',                           'releases',            'release.approved',        'Approved statutory-impacting release 1.3.2 (step-up verified)', 'rel-1.3.2')
on conflict do nothing;

-- ---- Aggregate analytics (counts only, never identities) -------------------

insert into public.analytics_summary_metrics (key, label, value, description, sort_order) values
  ('active-students',          'Active students',          4820,  'Unique sessions in the last 7 days',            1),
  ('notifications-delivered',  'Notifications delivered',  18240, 'Push and inbox deliveries in the last 30 days', 2),
  ('welfare-referrals',        'Welfare referrals',        37,    'Submitted in the last 30 days, count only',     3),
  ('scholarship-applications', 'Scholarship applications', 612,   'Submitted in the last 30 days',                 4)
on conflict (key) do nothing;

insert into public.analytics_module_usage (module, label, sessions_30d, sort_order) values
  ('SA.02', 'My Schedule',             21400, 1),
  ('SA.08', 'Notifications',           18900, 2),
  ('SA.04', 'Grades and Transcript',   16200, 3),
  ('SA.09', 'Fees and Payments',        9800, 4),
  ('SA.01', 'Admissions Status',        7400, 5),
  ('SA.11', 'Library',                  6300, 6),
  ('SA.10', 'Hostel',                   4100, 7),
  ('SA.13', 'Scholarships',             3900, 8),
  ('SA.12', 'Welfare and Counselling',  1200, 9)
on conflict (module) do nothing;

insert into public.analytics_category_delivery (category, delivered_30d, sort_order) values
  ('Results',               5200, 1),
  ('Exam Notices',          4100, 2),
  ('Fees',                  3600, 3),
  ('Admission Decisions',   2400, 4),
  ('Library',               1500, 5),
  ('Scholarships',           900, 6),
  ('Welfare Safety Alerts',  540, 7)
on conflict (category) do nothing;

insert into public.analytics_weekly_active (week_start, active_students) values
  ((now() - interval '6 weeks')::date, 4300),
  ((now() - interval '5 weeks')::date, 4450),
  ((now() - interval '4 weeks')::date, 4620),
  ((now() - interval '3 weeks')::date, 4510),
  ((now() - interval '2 weeks')::date, 4700),
  ((now() - interval '1 weeks')::date, 4820)
on conflict (week_start) do nothing;
