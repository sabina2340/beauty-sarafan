import { Master } from '@/lib/types';

export const mockMasters: Master[] = [
  {
    id: '1',
    name: 'Luna Hair Studio',
    category: 'hair',
    categoryLabel: 'Парикмахер',
    city: 'Москва',
    shortDescription: 'Стрижки, окрашивание и уход для волос любой длины.',
    description:
      'Специализируемся на современных женских и мужских стрижках, сложных техниках окрашивания и восстановлении волос.',
    services: ['Женская стрижка', 'Окрашивание airtouch', 'Укладка', 'Уходовые процедуры'],
    contacts: {
      phone: '+7 (900) 111-11-11',
      telegram: '@lunahair'
    }
  },
  {
    id: '2',
    name: 'Nail Point by Kate',
    category: 'nails',
    categoryLabel: 'Ногтевой сервис',
    city: 'Санкт-Петербург',
    shortDescription: 'Маникюр и педикюр с безопасной обработкой и стерилизацией.',
    description:
      'Авторские дизайны, укрепление ногтей и аппаратный педикюр. Работаем с гипоаллергенными материалами.',
    services: ['Маникюр', 'Педикюр', 'Наращивание', 'Дизайн ногтей'],
    contacts: {
      phone: '+7 (911) 222-22-22',
      instagram: '@nailpoint.kate'
    }
  },
  {
    id: '3',
    name: 'Brow Atelier',
    category: 'brows',
    categoryLabel: 'Бровист',
    city: 'Казань',
    shortDescription: 'Архитектура бровей и ламинирование с натуральным эффектом.',
    description:
      'Подчёркиваем форму лица через точную архитектуру бровей. Используем мягкие и стойкие составы.',
    services: ['Коррекция бровей', 'Окрашивание', 'Ламинирование', 'Подбор формы'],
    contacts: {
      phone: '+7 (987) 333-33-33'
    }
  },
  {
    id: '4',
    name: 'Relax Massage Space',
    category: 'massage',
    categoryLabel: 'Массаж',
    city: 'Москва',
    shortDescription: 'Классический и лимфодренажный массаж для восстановления.',
    description:
      'Сеансы массажа для снятия напряжения, улучшения осанки и общего самочувствия. Индивидуальный подход к каждому клиенту.',
    services: ['Классический массаж', 'Лимфодренаж', 'Антистресс-программа'],
    contacts: {
      phone: '+7 (905) 444-44-44',
      telegram: '@relaxmassage'
    }
  }
];
