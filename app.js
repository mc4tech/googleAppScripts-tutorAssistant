// Gets data from Student Roster
function getStudentRoster() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
  // const sheetName = sheet.getName()
  const headers = sheet.getRange("A2:P2").getValues()
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
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate()+3); 
  const events = CalendarApp.getEventsForDay(tomorrow)
  const tutorSessions = []
  events.forEach(el=> {
      const description = el.getDescription()
      const title = el.getTitle()
      const isCanceled = title.toLowerCase().includes('canceled')
      const isTutorSession = description.includes('Tutorial Session')
      const session = {}
      if(!isCanceled && isTutorSession){
        const myStatus = el.getMyStatus()
        const guestStatus = el.getGuestList()[0] ? el.getGuestList()[0].getStatus() : null 
        session.guestEmail = el.getGuestList()[0] ? el.getGuestList()[0].getEmail() : null
        const student = table.find(row => row[emailColIndex] === session.guestEmail)
        const timeZone = student[timeZoneColIndex] ? student[timeZoneColIndex] : 'EST'
        const needsTimeZone = student[timeZoneColIndex] ? false : true 
        session.sessionStart = new Date(el.getStartTime()).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true , timeZone: timeZone })
        session.sessionDate = new Date(el.getStartTime()).toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: '2-digit', year: 'numeric' })
        // const convertedTZ = new Intl.DateTimeFormat('en', { hour: 'numeric', hourCycle: 'h12', dayPeriod: 'narrow', timeZone: 'NST', timeZoneName: 'long' }).format(el.getStartTime())
        // new Date(el.getStartTime()).toLocaleString('en-CA', { hour: 'numeric', minute: 'numeric', hour12: true , timeZone: "PST" , timeZoneName: "long"})
      
        // console.log(`description: ${description}`)
        // console.log(`title: ${title}`)
        // console.log(`sessionDate: ${session.sessionDate}`)
        // console.log(`sessionStart: ${session.sessionStart}`)
        // // console.log(`convertedTZ: ${convertedTZ}`)
        // console.log(`myStatus: ${myStatus}`)
        // console.log(`"events*****",${guestStatus},  email: ${session.guestEmail}`)
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
  
// get most recent past Monday
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