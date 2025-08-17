import React from "react";
import { useAuth } from "../context/AuthContext"; // Asegúrate de la ruta

export default function Weather() {
  const { email } = useAuth(); // Lee el email del contexto
  const authDataExists = !!email;

  const defaultImageUrl = "https://www.clarin.com/img/2016/01/08/BJynA4gVg_1200x0.jpg";
  const authImageUrl = "https://cdn.memegenerator.es/imagenes/memes/full/4/35/4355566.jpg";

  return (
    <div>
      <h1 id="tableLabel">Weather</h1>
      {authDataExists ? (
        <img src={authImageUrl} alt="Auth Image" />
      ) : (
        <img src={defaultImageUrl} alt="No Auth Image" />
      )}
    </div>
  );
}