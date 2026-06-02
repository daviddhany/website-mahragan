const Student = require('./models/Student');

async function generateStudentCode(gender, className, entryYear) {
  // Generic student code format: YY + Gender + Department + 3-digit serial
  // Example: 25MA001 = 2025, Male, Department A, serial 001
  const genderCode = gender === 'male' ? 'M' : 'F';

  const classCodes = {
    'Department A': 'A',
    'Department B': 'B',
    'Department C': 'C',
    'Upper Department': 'D',
    'Middle Department': 'E'
  };

  const classCode = classCodes[className];
  const yearNumber = Number(entryYear);

  if (!classCode) {
    throw new Error('Invalid department for student code');
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
  while (usedNumbers.includes(nextNumber)) nextNumber++;

  return `${prefix}${String(nextNumber).padStart(3, '0')}`;
}

function normalizeClassName(value) {
  if (value === undefined || value === null) return value;
  const text = String(value).trim();
  const map = {
    'department a': 'Department A',
    'department b': 'Department B',
    'department c': 'Department C',
    'upper department': 'Upper Department',
    'middle department': 'Middle Department',
    'يوحنا': 'Department A',
    'ابوسيفين': 'Department B',
    'العذراء': 'Department C',
    'خمسة و ستة': 'Upper Department',
    'إعدادي': 'Middle Department',
    'اعدادي': 'Middle Department'
  };
  return map[text.toLowerCase()] || map[text] || text;
}

function normalizeStudentYear(value) {
  if (value === undefined || value === null) return value;
  const text = String(value).trim();
  const map = {
    'اولى إبتدائي': 'Grade 1',
    'تانية إبتدائي': 'Grade 2',
    'ثالثة إبتدائي': 'Grade 3',
    'رابعة إبتدائي': 'Grade 4',
    'خمسة إبتدائي': 'Grade 5',
    'سادسة إبتدائي': 'Grade 6',
    'اولى اعدادي': 'Grade 7',
    'تانية اعدادي': 'Grade 8',
    'ثالثة اعدادي': 'Grade 9'
  };
  return map[text] || text;
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

function normalizeArabicEducationValue(value) {
  return normalizeStudentYear(value);
}

function requireFields(body, fields) {
  return fields.filter((field) => !body[field] || String(body[field]).trim() === '');
}

module.exports = {
  generateStudentCode,
  requireFields,
  normalizeClassName,
  normalizeStudentYear,
  getEntryYearFromStudentYear,
  normalizeArabicEducationValue
};
