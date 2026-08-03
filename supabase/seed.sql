-- ============================================================
-- WHMI CPD Dashboard — demo seed data
-- Run AFTER schema.sql, once, in the SQL Editor. Safe to re-run (idempotent
-- via ON CONFLICT DO NOTHING) if you want to reset after wiping rows.
-- ============================================================

insert into public.staff (id,name,profession,campuses,department,hours,attended,certificates,modality,grade,qualified_year,hours_last_3_years,events_this_year,last_attended,attended_event_ids) values
('s1','Amir Hossain','Radiographer','{SH}','Medical Imaging',18.5,9,8,'General XR','Grade 2',2019,15,4, current_date - 14, '{p1,p3}'),
('s2','Leah Biffin','MRI Radiographer','{FH}','Medical Imaging',14,6,6,'MRI','Senior',2014,9,2, current_date - 14, '{p1,p4}'),
('s3','Min Ku','Sonographer','{SH,SDH}','Medical Imaging',21,11,10,'Ultrasound','Senior',2011,12,5, current_date - 84, '{}'),
('s4','Paul Kelly','Radiographer','{WTN}','Medical Imaging',9.5,5,5,'General XR','Grade 1',2022,9.5,3, current_date - 28, '{}'),
('s5','Son Nguyen','CT Radiographer','{SH}','Medical Imaging',16,7,7,'CT','Grade 2',2018,10,3, current_date - 56, '{}'),
('s6','Priya Raman','Radiographer','{FH,WTN}','Medical Imaging',11,6,4,'General XR','Grade 1',2021,11,4, current_date - 28, '{}'),
('s7','Chris Owusu','Student Radiographer','{SH}','Medical Imaging',6,3,2,'General XR','Student',null,6,3, current_date - 70, '{}'),
('s8','Grace Tan','Radiographer','{WTN,SDH}','Medical Imaging',19,10,9,'Mammography','Clinical Educator',2009,11,4, current_date - 42, '{}')
on conflict (id) do nothing;

insert into public.users (id,name,email,role,staff_id,avatar_id,avatar_color) values
('u1','Ryan','ryan@westernhealth.org.au','admin',null,'magnet','blue'),
('u2','Leah Biffin','leah.biffin@westernhealth.org.au','owner','s2','waves','purple'),
('u3','Amir Hossain','amir.hossain@westernhealth.org.au','viewer','s1','bone','green')
on conflict (id) do nothing;

-- Upcoming events
insert into public.events (id,title,topic,date,start_time,end_time,location,mode,presenter,registered,capacity,waitlist,status,meeting_url) values
('e0','Contrast Reaction Simulation Drill','MRI', (now() + interval '3 hours')::date, to_char(now()+interval '3 hours','HH24:MI'), to_char(now()+interval '4 hours','HH24:MI'), 'Microsoft Teams','Online','R. Chen',18,40,0,'Registration Open','https://teams.microsoft.com/l/meetup-join/whmi-cpd-demo'),
('e1','Advanced Trauma Imaging Series','Trauma', current_date+3,'13:00','15:00','Sunshine Hospital, Education Centre','Hybrid','Dr. A. Okafor',42,60,0,'Registration Open','https://teams.microsoft.com/l/meetup-join/whmi-cpd-trauma'),
('e2','MSK Ultrasound Masterclass','MSK', current_date+9,'09:00','12:30','Footscray Hospital, Room 3','In-person','S. Ferreira',28,30,4,'Registration Open',null),
('e3','MRI Safety Update 2026','MRI', current_date+16,'12:00','13:00','Microsoft Teams','Online','R. Chen',61,100,0,'Registration Open','https://teams.microsoft.com/l/meetup-join/whmi-cpd-mri-safety'),
('e4','Leadership in Radiography','Leadership', current_date+24,'14:00','16:00','Western Health Education Hub','Hybrid','J. Hewis',15,40,0,'Draft','https://teams.microsoft.com/l/meetup-join/whmi-cpd-leadership'),
('e5','Paediatric CT Protocols','CT', current_date+30,'10:00','11:30','Sunshine Hospital, Education Centre','In-person','Dr. M. Nguyen',33,35,0,'Awaiting Approval',null),
('e6','Research Methods for Clinicians','Research', current_date+37,'13:00','16:00','Microsoft Teams','Online','Dr. A. Okafor',9,50,0,'Registration Open','https://teams.microsoft.com/l/meetup-join/whmi-cpd-research')
on conflict (id) do nothing;

-- Previous (archived/completed) events
insert into public.events (id,title,topic,date,location,mode,presenter,status,attendance,capacity,feedback) values
('p1','Contrast Media Safety Refresher','MRI', current_date-14,'Archived','In-person','R. Chen','Completed',44,50,4.6),
('p2','Ultrasound Fundamentals Day','Ultrasound', current_date-28,'Archived','In-person','S. Ferreira','Completed',38,40,4.8),
('p3','Trauma Case Review Journal Club','Trauma', current_date-42,'Archived','In-person','Dr. A. Okafor','Completed',27,30,4.3),
('p4','CT Dose Optimisation Workshop','CT', current_date-56,'Archived','In-person','Dr. M. Nguyen','Completed',31,35,4.5),
('p5','Leadership Foundations','Leadership', current_date-70,'Archived','In-person','J. Hewis','Completed',22,25,4.7),
('p6','MSK Reporting Essentials','MSK', current_date-84,'Archived','In-person','S. Ferreira','Completed',40,40,4.4)
on conflict (id) do nothing;

insert into public.certificates (id,staff_name,event_id,event_title,status,date) values
('c1','Amir Hossain','p1','Contrast Media Safety Refresher','Awaiting Approval', current_date-14),
('c2','Priya Raman','p2','Ultrasound Fundamentals Day','Awaiting Approval', current_date-28),
('c3','Grace Tan','p3','Trauma Case Review Journal Club','Sent', current_date-42),
('c4','Son Nguyen','p4','CT Dose Optimisation Workshop','Sent', current_date-56),
('c5','Chris Owusu','p5','Leadership Foundations','Awaiting Approval', current_date-70),
('c6','Min Ku','p6','MSK Reporting Essentials','Sent', current_date-84)
on conflict (id) do nothing;
