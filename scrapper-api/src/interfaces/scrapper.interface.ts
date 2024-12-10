export enum Category {
  VEHICLE = "vehicle",
}

export interface ScrapperSearchDto {
  isWildSearch: boolean;
  model?: string;
  brand?: string;
  category?: Category;
  text?: string;
}

export interface ScrapedCarData {
  title: string;
  price: string;
  location: string;
  link?: string;
}
