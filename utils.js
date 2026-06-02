const Student = require('./models/Student');

async function generateStudentCode(gender, className, entryYear) {
  const genderCode = gender === 'male' ? 'M' : 'F';

  const classCodes = {
    'Department A': 'A',
    'Department B': 'B',
    'Department C': 'C',
    'Upper Primary': 'D',
    'Middle School': 'E'
  };

  const classCode = classCodes[className];
  const yearNumber = Number(entryYear);

  if (!classCode) {
    throw new Error('Invalid department name for student code');
  }

  if (!Number.isInteger(yearNumber) || yearNumber < 2000 || yearNumber > 2099) {
    throw new Error('Invalid entry year for student code');
  }

  const yearCode = String(yearNumber).slice(-2);
  const prefix = `${yearCode}${genderCode}${classCode}`;

  const students = await Student.find({
    studentCode: { $regex: `^${prefix}\\d{3}$` }
  }).select('studentCode');

  const usedNumbers = students
    .map((student) => Number(String(student.studentCode || '').slice(-3)))
    .filter((number) => Number.isInteger(number));

  let nextNumber = 1;

  while (usedNumbers.includes(nextNumber)) {
    nextNumber++;
  }

  const serial = String(nextNumber).padStart(3, '0');

  return `${prefix}${serial}`;
}

function normalizeClassName(value) {
  if (value === undefined || value === null) return value;
  return String(value).trim();
}

function normalizeStudentYear(value) {
  if (value === undefined || value === null) return value;
  return String(value).trim();
}

function getEntryYearFromStudentYear(studentYear) {
  const normalized = normalizeStudentYear(studentYear);
  const entryYearByStudentYear = {
    'Grade 1': 2025,
    'Grade 2': 2024,
    'Grade 3': 2023,
    'Grade 4': 2022,
    'Grade 5': 2021,
    'Grade 6': 2020,
    'Grade 7': 2019,
    'Grade 8': 2018,
    'Grade 9': 2017
  };

  return entryYearByStudentYear[normalized] || null;
}

function normalizeEducationValue(value) {
  return normalizeStudentYear(value);
}

function requireFields(body, fields) {
  return fields.filter(
    (field) => !body[field] || String(body[field]).trim() === ''
  );
}

module.exports = {
  generateStudentCode,
  requireFields,
  normalizeClassName,
  normalizeStudentYear,
  getEntryYearFromStudentYear,
  normalizeArabicEducationValue: normalizeEducationValue,
  normalizeEducationValue
};
