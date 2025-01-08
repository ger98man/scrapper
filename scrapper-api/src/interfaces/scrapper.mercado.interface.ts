export enum MercadoCategory {
  VEHICLE = "vehicle",
}

export interface MercadoScrapperSearchDto {
  isWildSearch: boolean;
  model?: string;
  brand?: string;
  category?: MercadoCategory;
  text?: string;
}

export interface MercadoScrapedCarData {
  title: string;
  price: string;
  location: string;
  link?: string;
}
