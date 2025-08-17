import { useEffect, useState } from "react";

export default function Weather() {
  const [authDataExists, setAuthDataExists] = useState<boolean>(false);

  useEffect(() => {
    // Check for authData in localStorage
    const authDataString = localStorage.getItem("authData");
    setAuthDataExists(!!authDataString);
  }, []);

  // Define image URLs
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