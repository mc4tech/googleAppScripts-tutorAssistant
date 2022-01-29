// Gets data from Student Roster
function getStudentRoster() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet()
    // const sheetName = sheet.getName()
    const headers = sheet.getRange("A2:G2").getValues()[0]
    // const table = sheet.getDataRange().getValues()
    const table = sheet.getSheetByName('Student Roster').getDataRange().getValues()
    const data = {
      headers,
      table
    }
    return data
  }
  
  // get all tutor sessions for tomorrow
  function getTutorSessions(roster){
    const {headers, table } = roster
    
    const localeOptions = {
      lang: 'en-US',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      weekDay: 'long',
      month: 'long',
      day: '2-digit',
      year: 'numeric'
    }
    
    const emailColIndex = headers.findIndex(el => el.toLowerCase().includes('email'))
    const timeZoneColIndex = headers.findIndex(el => el.toLowerCase().includes('timezone'))
    const studentNameIndex = headers.findIndex(el => el.toLowerCase().includes('student name'))
  
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate()+3); 
    
    const tutorSessions = []
    const events = CalendarApp.getEventsForDay(tomorrow)
    
    events.forEach(el=> {
        const description = el.getDescription()
        const title = el.getTitle()
        const isCanceled = title.toLowerCase().includes('canceled')
        const isTutorSession = description.includes('Tutorial Session')
  
        if(!isCanceled && isTutorSession){
          
          const student = table.find(row => row[emailColIndex] === session.guestEmail)
          const studentName = student[studentNameIndex].split(", ")
          const timeZone = student[timeZoneColIndex] ? student[timeZoneColIndex] : 'EST'
          const needsTimeZone = student[timeZoneColIndex] ? false : true 
          
          const myStatus = el.getMyStatus()
          const guestStatus = el.getGuestList()[0] ? el.getGuestList()[0].getStatus() : null 
          const guestEmail = el.getGuestList()[0] ? el.getGuestList()[0].getEmail() : null
          const sessionStart = new Date(el.getStartTime()).toLocaleString(localeOptions.lang, { hour: localeOptions.hour, minute: localeOptions.minute, hour12: localeOptions.hour12 , timeZone: timeZone })
          const sessionDate = new Date(el.getStartTime()).toLocaleDateString(localeOptions.lang, {weekday: localeOptions.weekDay, month: localeOptions.month, day: localeOptions.day, year: localeOptions.year })
          const firstName = studentName[1]
          const lastName = studentName[0]
          const hasTimeZone = needsTimeZone
          
          const session = {
            firstName,
            lastName,
            myStatus,
            guestStatus,
            guestEmail,
            sessionStart,
            sessionDate,
            hasTimeZone
          }
  
          console.log(session)
          tutorSessions.push(session)
        }
    })
  
    return tutorSessions 
  }
  
  async function filterTutorSessions (){
    const roster = await getStudentRoster()
    const tutorSessions = await getTutorSessions(roster)
  }
    
  //   function getMonday(d) {
  //   d = new Date(d);
  //   var day = d.getDay(),
  //       diff = d.getDate() - day + (day == 0 ? -6:1); // adjust when day is sunday
     
  //   const dateRange = {
  //     currentMonday: new Date(d.setDate(diff)),
  //     currentSunday: new Date(d.setDate(diff +6)),
  //     prevMonday: new Date(d.setDate(diff -7)),
  //     prevSunday: new Date(d.setDate(diff -1))
  //   }
  //   return dateRange;
  // }