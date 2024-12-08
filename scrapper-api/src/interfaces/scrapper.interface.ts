export enum Category {
  VEHICLE = "vehicle",
}

export interface ScrapperParamsDto {
  model: string;
  brand: string;
  category: Category;
}

export interface ScrapedCarData {
  title: string;
  price: string;
  location: string;
  link?: string;
}
