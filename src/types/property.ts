export enum PropertyType {
  HOUSE = 'HOUSE',
  APARTMENT = 'APARTMENT',
  GUESTHOUSE = 'GUESTHOUSE',
  HOTEL = 'HOTEL',
  VILLA = 'VILLA',
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Location {
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  coordinates?: Coordinates;
}

export interface Image {
  url: string;
  publicId: string;
}

export interface Host {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  location: Location;
  price: number;
  images: Image[];
  amenities: string[];
  host: Host;
  maxGuests: number;
  type: PropertyType;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PropertyFilterInput {
  location?: string;
  priceMin?: number;
  priceMax?: number;
  type?: PropertyType;
  maxGuests?: number;
}

export interface CreatePropertyInput {
  title: string;
  description: string;
  location: Omit<Location, 'coordinates'>;
  price: number;
  images?: Image[];
  amenities: string[];
  maxGuests: number;
  type: PropertyType;
}

export interface UpdatePropertyInput extends Partial<CreatePropertyInput> {
  id: string;
}