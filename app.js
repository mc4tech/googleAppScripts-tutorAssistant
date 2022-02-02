const {localeOptions, gmailOpts} = require('./config')
// Gets data from Student Roster
function getStudentRoster() {
  const activeSheet = SpreadsheetApp.getActiveSpreadsheet();
  // const sheetName = sheet.getName()
  const sheet = activeSheet.getSheetByName("Student Roster");
  const headers = sheet.getRange("A2:G2").getValues()[0];
  // const table = sheet.getDataRange().getValues()
  const table = sheet.getDataRange().getValues();
  const data = {
    headers,
    table,
  };
  return data;
}

function isString(str) {
  if (typeof str === "string") {
    return true;
  }
  return false;
}

// get all tutor sessions for tomorrow
function getTutorSessions(roster) {
  const { headers, table } = roster;

  const emailColIndex = headers.findIndex((el) => {
    if (isString(el)) {
      return el.toLowerCase().includes("email");
    }
    return false;
  });
  const timeZoneColIndex = headers.findIndex((el) => {
    if (isString(el)) {
      return el.toLowerCase().includes("timezone");
    }
    return false;
  });
  const studentNameIndex = headers.findIndex((el) => {
    if (isString(el)) {
      return el.toLowerCase().includes("student name");
    }
    return false;
  });
  const zoomIndex = headers.findIndex((el) => {
    if (isString(el)) {
      return el.toLowerCase().includes("zoom");
    }
    return false;
  });
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const tutorSessions = [];
  const events = CalendarApp.getEventsForDay(tomorrow);

  events.forEach((el) => {
    const description = el.getDescription();
    const title = el.getTitle();
    const isCanceled = title.toLowerCase().includes("canceled");
    const isTutorSession = description.includes("Tutorial Session");

    if (!isCanceled && isTutorSession) {
      const myStatus = el.getMyStatus();
      const titleArr = title.split(" ");
      const nameIndex =
        titleArr.findIndex((el) => el.toLowerCase() === "and") + 1;
      const tutorName = `${titleArr[nameIndex]} ${titleArr[nameIndex + 1]}`;
      const guestStatus = el.getGuestList()[0]
        ? el.getGuestList()[0].getStatus()
        : null;
      const guestEmail = el.getGuestList()[0]
        ? el.getGuestList()[0].getEmail()
        : null;

      const sessionDate = new Date(el.getStartTime()).toLocaleDateString(
        localeOptions.lang,
        {
          weekday: localeOptions.weekDay,
          month: localeOptions.month,
          day: localeOptions.day,
          year: localeOptions.year,
        }
      );

      const session = {
        myStatus,
        guestStatus,
        guestEmail,
        sessionDate,
        tutorName,
      };

      const student = table.find(
        (row) => row[emailColIndex] === session.guestEmail
      );
      const studentName = student[studentNameIndex].split(", ");
      const zoomLink = student[zoomIndex];
      const timeZone = student[timeZoneColIndex]
        ? student[timeZoneColIndex]
        : "";
      const hasTimeZone = student[timeZoneColIndex] ? true : false;

      const sessionStart = new Date(el.getStartTime()).toLocaleString(
        localeOptions.lang,
        {
          hour: localeOptions.hour,
          minute: localeOptions.minute,
          hour12: localeOptions.hour12,
          timeZone: timeZone || localeOptions.defaultTimeZone,
        }
      );

      const firstName = studentName[1];
      const lastName = studentName[0];

      session.studentFirstName = firstName;
      session.studentLastName = lastName;
      session.hasTimeZone = hasTimeZone;
      session.sessionStart = sessionStart;
      session.defaultTimeZone = localeOptions.defaultTimeZone;
      session.timeZone = timeZone;
      session.zoomLink = zoomLink;
      session.formattedStart = `${session.sessionDate} ${
        session.sessionStart
      } ${session.hasTimeZone ? session.timeZone : session.defaultTimeZone}`;

      console.log(session);
      tutorSessions.push(session);
    }
  });

  return tutorSessions;
}

async function filterTutorSessions() {
  const roster = await getStudentRoster();
  const tutorSessions = await getTutorSessions(roster);
  return tutorSessions;
}

async function buildEmails() {
  // const emailApp = GmailApp.
  const data = {
    tutorSessions: await filterTutorSessions(),
    templateEmail: await getTemplate(templateNames.confirmationEmail),
  };
  const { tutorSessions, templateEmail } = data;

  const completedTemplates = fillTemplate(tutorSessions, templateEmail);
  const emailApp = GmailApp;
  completedTemplates.forEach((template) => {
    emailApp.sendEmail(
      template.studentEmail,
      template.subject,
      template.body,
      {
        htmlBody: template.htmlBody,
        cc: gmailOpts.ccTo,
        // bcc: template.bcc
      }
    );
  });
}

function getTemplate(templateType) {
  const drafts = GmailApp.getDrafts();
  const messages = drafts.map((el) => el.getMessage());

  const findTemplate = messages.find((el) =>
    el.getSubject().includes(templateType)
  );
  const templateEmail = {
    subject: findTemplate.getSubject(),
    htmlBody: findTemplate.getBody(),
    body: findTemplate.getPlainBody(),
    id: findTemplate.getId(),
  };
  return templateEmail;
}

function fillTemplate(tutorSessions, templateEmail) {
  const placeHolders = {
    studentFirstName: {
      temp: "<Student First Name>",
      body: true,
    },
    bodyDate: {
      temp: "<Day of week / Date and Time Using The Student’s Timezone><",
      secondTemp: "Specify Timezone>",
      secondVal: "",
      body: true,
    },
    subjectDate: {
      temp: "<Day of week / Date and Time Using The Student’s Timezone><Specify Timezone>.",
      subject: true,
    },
    zoomLink: {
      temp: "<Tutor’s Zoom Link>",
      body: true,
    },
    tutorName: {
      temp: "<Tutor First Name>",
      body: true,
    },
    curriculum: {
      temp: "<Curriculum>",
      subject: true,
    },
  };
  const templates = tutorSessions.map((session) => {
    let { subject, body } = templateEmail;
    session.curriculum = "FSF";
    for (let key in placeHolders) {
      const replaceThis = placeHolders[key].temp;
      const re = new RegExp(replaceThis, "gi");
      const newValue = key.includes("Date")
        ? session.formattedStart
        : session[key];
      if (placeHolders[key].subject) {
        subject = subject.replace(re, newValue);
      }
      if (placeHolders[key].body) {
        if (placeHolders[key].secondTemp) {
          const replaceSec = placeHolders[key].secondTemp;
          const secRE = new RegExp(replaceSec, "gi");
          const secValue = placeHolders[key].secondVal;

          body = body.replace(re, newValue).replace(secRE, secValue);
        } else {
          body = body.replace(re, newValue);
        }
      }
    }
    const studentEmail = session.guestEmail;
    const filledTemplate = { subject, body, studentEmail };
    return filledTemplate;
  });

  return templates;
}
