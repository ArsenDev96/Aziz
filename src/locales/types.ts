import type { en } from './en';

/** Every locale must provide exactly the English key set. */
export type Strings = {
  [Section in keyof typeof en]: {
    [Key in keyof (typeof en)[Section]]: (typeof en)[Section][Key] extends object
      ? { [Sub in keyof (typeof en)[Section][Key]]: string }
      : string;
  };
};

export type Language = 'hy' | 'en';
