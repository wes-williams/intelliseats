// this is a messy start
function findRiskFactor(grade) {
  var riskFactor=0;
  // numeric grading
  if(grade.numericGradeEarned != undefined) {
    var thisGrade = grade.numericGradeEarned;
    // 1-5 grading system?
    if(thisGrade <=5) {
      if(thisGrade == 3)
        riskFactor = 2;
      else if(thisGrade == 2)
        riskFactor = 5;
      else if(thisGrade == 1)
        riskFactor = 10;
    }
    // 0-100 grading system
    else {
      if(thisGrade > 80 && thisGrade < 85)
        riskFactor = 2;
      else if(thisGrade > 70 && thisGrade < 80)
        riskFactor = 5;
      else if(thisGrade < 70)
        riskFactor = 10;
    }
  }
  // letter grading A-F
  else if(grade.letterGradeEarned!=undefined) {
    switch(grade.letterGradeEarned[0]) {
      case 'C':
        riskFactor = 2;
        break;
      case 'D':
        riskFactor = 5;
        break;
      case 'F':
        riskFactor = 10;
        break;
    }
  }
  return riskFactor;
}

function assessStudentStatus(student) {
  var studentStatus;

  if (student.riskFactor > 15)
     studentStatus = 'bad';
  else if (student.riskFactor > 7)
    studentStatus = 'warning';
  else
    studentStatus = 'good';

  return studentStatus;
}

var intel = {}
intel.findRiskFactor = findRiskFactor;
intel.assessStudentStatus = assessStudentStatus;

module.exports = intel;
