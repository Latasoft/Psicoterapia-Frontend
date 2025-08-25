import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { inject } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ContactoService {
  private firestore = inject(Firestore);  // Inyecta el servicio Firestore

  constructor() {}

  async enviarFormulario(data: any) {
    const contactosRef = collection(this.firestore, 'contactos');
    await addDoc(contactosRef, data);
  }
}
