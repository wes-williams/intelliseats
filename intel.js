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

var intel = {}
intel.findRiskFactor = findRiskFactor;

module.exports = intel;
