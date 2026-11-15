// Original fictional household inventory examples for ICA demonstration.
// Relative expiry dates ensure the expiry alerts remain useful on demo day.
import { addDays } from '../utils/medicine';
const rows = [
 ['Paracetamol','Tablets','Tablet','500 mg',24,'tablets',-14,'Cabinet A',5,'Label information only'],
 ['Cetirizine','Tablets','Tablet','10 mg',3,'tablets',12,'Drawer 1',5,''],
 ['Vitamin C','Tablets','Tablet','500 mg',18,'tablets',120,'Cabinet A',5,''],
 ['Ibuprofen','Tablets','Tablet','200 mg',6,'tablets',-5,'Cabinet B',6,''],
 ['Amoxicillin','Capsules','Capsule','250 mg',8,'capsules',15,'Cabinet B',5,'For inventory demonstration'],
 ['Omeprazole','Capsules','Capsule','20 mg',2,'capsules',210,'Drawer 2',5,''],
 ['Zinc','Tablets','Tablet','20 mg',30,'tablets',60,'Drawer 1',8,''],
 ['Calcium','Tablets','Tablet','500 mg',12,'tablets',365,'Cabinet A',10,''],
 ['Cough Syrup A','Syrups','Syrup','100 mL',1,'bottles',9,'Shelf 1',1,''],
 ['Antacid Liquid','Syrups','Syrup','200 mL',2,'bottles',180,'Shelf 1',1,''],
 ['Saline Nasal Spray','Sprays','Spray','30 mL',1,'bottles',0,'Shelf 2',1,''],
 ['Throat Spray','Sprays','Spray','20 mL',2,'bottles',240,'Shelf 2',1,''],
 ['Eye Lubricant','Drops','Drops','10 mL',1,'bottles',20,'Cool Drawer',1,''],
 ['Ear Drops','Drops','Drops','10 mL',0,'bottles',-30,'Cabinet C',1,''],
 ['Moisturizing Cream','Creams','Cream','50 g',2,'tubes',400,'Shelf 3',1,''],
 ['Antiseptic Cream','Creams','Cream','25 g',1,'tubes',28,'First Aid Box',1,''],
 ['Skin Barrier Cream','Creams','Cream','30 g',1,'tubes',250,'Cabinet C',1,''],
 ['Electrolyte Sachets','Sachets','Powder','1 sachet',8,'sachets',95,'First Aid Box',5,''],
 ['Oral Rehydration Salts','Sachets','Powder','1 sachet',4,'sachets',16,'First Aid Box',5,''],
 ['Herbal Tea Sachets','Sachets','Powder','1 sachet',12,'sachets',185,'Pantry Box',4,''],
 ['Antiseptic Wipes','Other','Other','10 wipes',2,'packs',300,'First Aid Box',2,''],
 ['Vitamin D','Capsules','Capsule','1000 IU',15,'capsules',30,'Drawer 2',6,''],
 ['Multivitamin','Capsules','Capsule','Label strength',25,'capsules',450,'Drawer 2',5,''],
 ['Allergy Relief Gel','Other','Gel','30 g',1,'tubes',-1,'Shelf 3',1,''],
 ['Lozenges','Other','Other','Label strength',7,'units',7,'Cabinet A',8,''],
 ['Saline Solution','Other','Other','100 mL',2,'bottles',55,'Shelf 2',1,''],
 ['Vitamin B Complex','Tablets','Tablet','Label strength',10,'tablets',540,'Cabinet B',5,''],
 ['Cold Relief Capsules','Capsules','Capsule','Label strength',4,'capsules',22,'Cabinet C',5,'']
];
export const getSampleMedicines = () => rows.map(([name,category,form,strength_label,quantity,unit,days,storage_location,low_stock_threshold,notes]) => ({
 name, category, form, strength_label, quantity, unit, expiry_date: addDays(days), storage_location, low_stock_threshold, notes
}));
