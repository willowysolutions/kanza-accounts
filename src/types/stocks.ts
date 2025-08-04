

export interface Stock {
  item: { name: string };
  quantity: number;
  unit:string;
  reorderLevel:number;
  supplier:{name:string};
}