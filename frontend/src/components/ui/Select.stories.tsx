/**
 * Select Component Stories
 * Stories for the custom select dropdown component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Select } from './Select';

const meta = {
  title: 'UI/Select',
  component: Select,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'مكون القائمة المنسدلة القابل للتخصيص مع دعم البحث والأيقونات.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'النص الافتراضي للقائمة',
    },
    disabled: {
      control: 'boolean',
      description: 'حالة التعطيل',
    },
    searchable: {
      control: 'boolean',
      description: 'إمكانية البحث',
    },
    icon: {
      control: 'text',
      description: 'أيقونة القائمة',
    },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample options for all stories
const sampleOptions = [
  { value: 'option1', label: 'الخيار الأول' },
  { value: 'option2', label: 'الخيار الثاني' },
  { value: 'option3', label: 'الخيار الثالث' },
  { value: 'option4', label: 'الخيار الرابع' },
];

// Basic select
export const Default: Story = {
  render: () => {
    const [value, setValue] = useState('');
    
    return (
      <div className="w-64">
        <Select
          options={sampleOptions}
          value={value}
          onChange={setValue}
          placeholder="اختر خياراً"
        />
      </div>
    );
  },
};

// With preselected value
export const WithValue: Story = {
  render: () => {
    const [value, setValue] = useState('option2');
    
    return (
      <div className="w-64">
        <Select
          options={sampleOptions}
          value={value}
          onChange={setValue}
          placeholder="اختر خياراً"
        />
      </div>
    );
  },
};

// Searchable select
export const Searchable: Story = {
  render: () => {
    const [value, setValue] = useState('');
    
    const manyOptions = [
      { value: 'cairo', label: 'القاهرة' },
      { value: 'alexandria', label: 'الإسكندرية' },
      { value: 'giza', label: 'الجيزة' },
      { value: 'luxor', label: 'الأقصر' },
      { value: 'aswan', label: 'أسوان' },
      { value: 'mansoura', label: 'المنصورة' },
      { value: 'tanta', label: 'طنطا' },
      { value: 'ismailia', label: 'الإسماعيلية' },
    ];
    
    return (
      <div className="w-64">
        <Select
          options={manyOptions}
          value={value}
          onChange={setValue}
          placeholder="ابحث عن مدينة"
          searchable={true}
        />
      </div>
    );
  },
};

// With icon
export const WithIcon: Story = {
  render: () => {
    const [value, setValue] = useState('');
    
    return (
      <div className="w-64">
        <Select
          options={sampleOptions}
          value={value}
          onChange={setValue}
          placeholder="اختر خياراً"
          icon="🏫"
        />
      </div>
    );
  },
};

// Disabled state
export const Disabled: Story = {
  render: () => {
    return (
      <div className="w-64">
        <Select
          options={sampleOptions}
          value="option1"
          onChange={() => {}}
          placeholder="معطل"
          disabled={true}
        />
      </div>
    );
  },
};

// Multiple selects in a form
export const FormExample: Story = {
  render: () => {
    const [grade, setGrade] = useState('');
    const [subject, setSubject] = useState('');
    const [teacher, setTeacher] = useState('');

    const grades = [
      { value: 'grade1', label: 'الصف الأول الثانوي' },
      { value: 'grade2', label: 'الصف الثاني الثانوي' },
      { value: 'grade3', label: 'الصف الثالث الثانوي' },
    ];

    const subjects = [
      { value: 'math', label: 'الرياضيات' },
      { value: 'physics', label: 'الفيزياء' },
      { value: 'chemistry', label: 'الكيمياء' },
      { value: 'biology', label: 'الأحياء' },
    ];

    const teachers = [
      { value: 'teacher1', label: 'أ. أحمد محمد' },
      { value: 'teacher2', label: 'أ. فاطمة علي' },
      { value: 'teacher3', label: 'أ. محمد حسن' },
    ];

    return (
      <div className="w-80 space-y-4 p-4 bg-gray-50 rounded-lg" dir="rtl">
        <h3 className="text-lg font-semibold">نموذج التسجيل</h3>
        
        <div>
          <label className="block text-sm font-medium mb-2">المرحلة الدراسية</label>
          <Select
            options={grades}
            value={grade}
            onChange={setGrade}
            placeholder="اختر المرحلة"
            icon="📚"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">المادة الدراسية</label>
          <Select
            options={subjects}
            value={subject}
            onChange={setSubject}
            placeholder="اختر المادة"
            icon="📖"
            searchable={true}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">المدرس</label>
          <Select
            options={teachers}
            value={teacher}
            onChange={setTeacher}
            placeholder="اختر المدرس"
            icon="👨‍🏫"
            searchable={true}
          />
        </div>

        <div className="pt-2">
          <p className="text-sm text-gray-600">
            المرحلة: {grade || 'غير محدد'}<br />
            المادة: {subject || 'غير محدد'}<br />
            المدرس: {teacher || 'غير محدد'}
          </p>
        </div>
      </div>
    );
  },
};