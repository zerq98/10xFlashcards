import React, { useState, useId, useMemo } from "react";
import { z } from "zod";
import type { ApiErrorResponse, RegisterRequestDTO } from "../../types";

// Walidacja emaila
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

// Maksymalne długości pól jako zabezpieczenie przed atakami
const MAX_EMAIL_LENGTH = 100;
const MAX_PASSWORD_LENGTH = 128;

// Zaawansowana walidacja hasła
const validatePassword = (password: string): string | null => {
  if (password.length < 8) {
    return "Hasło musi mieć co najmniej 8 znaków";
  }

  if (!/[A-Z]/.test(password)) {
    return "Hasło musi zawierać co najmniej jedną dużą literę";
  }

  if (!/[a-z]/.test(password)) {
    return "Hasło musi zawierać co najmniej jedną małą literę";
  }

  if (!/[0-9]/.test(password)) {
    return "Hasło musi zawierać co najmniej jedną cyfrę";
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Hasło musi zawierać co najmniej jeden znak specjalny";
  }

  return null;
};

// Sprawdzenie siły hasła (0-100)
const calculatePasswordStrength = (password: string): number => {
  // Początkowy wynik
  let score = 0;

  // Brak hasła = brak punktów
  if (!password) return 0;

  // Podstawowa długość (do 25 pkt)
  score += Math.min(25, password.length * 2);

  // Różnorodność znaków
  const patterns = [
    /[a-z]/, // małe litery
    /[A-Z]/, // duże litery
    /[0-9]/, // cyfry
    /[^A-Za-z0-9]/, // znaki specjalne
  ];

  // Dodaj punkty za każdy rodzaj znaków (do 25 pkt)
  const uniqueTypes = patterns.filter((pattern) =>
    pattern.test(password)
  ).length;
  score += uniqueTypes * 6.25;

  // Dodatkowe punkty za długość powyżej 10 znaków (do 25 pkt)
  if (password.length > 10) {
    score += Math.min(25, (password.length - 10) * 2.5);
  }

  // Dodatkowe punkty za kombinację rodzajów znaków (do 25 pkt)
  if (uniqueTypes >= 2) score += 10;
  if (uniqueTypes >= 3) score += 10;
  if (uniqueTypes === 4) score += 5;

  // Ogranicz wynik do 100
  return Math.min(100, score);
};

export const RegisterForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  // IDs for accessibility
  const emailId = useId();
  const emailErrorId = useId();
  const passwordId = useId();
  const passwordConfirmId = useId();
  const errorId = useId();
  const passwordErrorId = useId();
  const passwordStrengthId = useId();

  // Obliczanie siły hasła
  const passwordStrength = useMemo(
    () => calculatePasswordStrength(password),
    [password]
  );

  // Funkcje pomocnicze do walidacji pól
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Ogranicz długość emaila
    if (value.length > MAX_EMAIL_LENGTH) {
      return;
    }

    setEmail(value);

    // Walidacja tylko gdy pole nie jest puste
    if (value && !validateEmail(value)) {
      setEmailError("Podaj poprawny adres email");
    } else {
      setEmailError(null);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;

    // Ogranicz długość hasła
    if (newPassword.length > MAX_PASSWORD_LENGTH) {
      return;
    }

    setPassword(newPassword);

    // Walidacja hasła w czasie rzeczywistym
    if (newPassword) {
      const error = validatePassword(newPassword);
      setPasswordError(error);
    } else {
      setPasswordError(null);
    }
  };

  const handlePasswordConfirmChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;

    // Ogranicz długość potwierdzenia hasła
    if (value.length > MAX_PASSWORD_LENGTH) {
      return;
    }

    setPasswordConfirm(value);
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Wykonaj trim emaila
    const trimmedEmail = email.trim();

    // Sprawdź czy pola są wypełnione
    if (!trimmedEmail || !password || !passwordConfirm) {
      setError("Wszystkie pola są wymagane");
      return;
    }

    // Sprawdzenie czy hasła się zgadzają
    if (password !== passwordConfirm) {
      setError("Hasła muszą być identyczne");
      return;
    }

    // Walidacja formatu emaila
    if (!validateEmail(trimmedEmail)) {
      setEmailError("Podaj poprawny adres email");
      return;
    }

    // Walidacja hasła
    const passwordValidationError = validatePassword(password);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      return;
    }

    setIsLoading(true);    try {
      // Wywołanie API do rejestracji
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: trimmedEmail,
          password,
        } as RegisterRequestDTO),
        credentials: "same-origin", // Ważne dla ciasteczek
      });

      const data = await response.json();
        if (!response.ok) {
        // Obsługa błędów z API
        const errorResponse = data as ApiErrorResponse;
        
        // Obsługa błędów związanych z istniejącym emailem (409)
        if (response.status === 409) {
          setError("Ten adres email jest już używany");
        } 
        // Obsługa błędów walidacji (400)
        else if (response.status === 400 && errorResponse.error.code === "VALIDATION_ERROR") {
          setError("Nieprawidłowe dane rejestracyjne");
        }
        // Dla pozostałych błędów - ogólny komunikat
        else {
          console.log("Unexpected error:", errorResponse);
          console.error("Registration error:", errorResponse.error);
          setError(
            "Wystąpił problem z rejestracją. Spróbuj ponownie później."
          );
        }
        return;
      }

      // Rejestracja pomyślna - przekierowanie
      window.location.href = "/topics";
    } catch (err) {
      console.error("Registration error:", err);
      setError("Wystąpił błąd podczas rejestracji. Spróbuj ponownie.");
    } finally {
      setIsLoading(false);
    }
  };
  // Kolor i etykieta wskaźnika siły hasła
  const getStrengthColor = () => {
    if (passwordStrength < 30) return "bg-red-600";
    if (passwordStrength < 60) return "bg-yellow-600";
    if (passwordStrength < 80) return "bg-lime-600";
    return "bg-green-600";
  };

  const getStrengthLabel = () => {
    if (passwordStrength < 30) return "Słabe";
    if (passwordStrength < 60) return "Średnie";
    if (passwordStrength < 80) return "Dobre";
    return "Silne";
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Alert z błędem */}
      {error && (
        <div
          className="bg-red-950/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-md mb-4"
          role="alert"
          id={errorId}
        >
          <p>{error}</p>
        </div>
      )}
      {/* Email field */}
      <div className="space-y-2">
        <label htmlFor={emailId} className="block text-sm font-medium">
          Adres email
        </label>
        <div
          className={`group ${
            emailError
              ? "bg-red-500"
              : "focus-within:bg-gradient-to-r focus-within:from-primary focus-within:via-secondary focus-within:to-accent bg-transparent"
          } p-[2px] rounded-md transition-all duration-300`}
        >
          <input
            id={emailId}
            type="email"
            autoComplete="email"
            required
            placeholder="twój@email.com"
            maxLength={MAX_EMAIL_LENGTH}
            className="w-full px-4 py-2 bg-gray-800 rounded-md focus:outline-none text-text"
            value={email}
            onChange={handleEmailChange}
            aria-describedby={
              emailError ? emailErrorId : error ? errorId : undefined
            }
            aria-invalid={emailError ? "true" : "false"}
          />
        </div>
        {emailError && (
          <p id={emailErrorId} className="text-red-400 text-xs mt-1">
            {emailError}
          </p>
        )}
      </div>
      {/* Password field */}
      <div className="space-y-2">
        <label htmlFor={passwordId} className="block text-sm font-medium">
          Hasło
        </label>
        <div
          className={`group ${
            passwordError
              ? "bg-red-500"
              : "focus-within:bg-gradient-to-r focus-within:from-primary focus-within:via-secondary focus-within:to-accent bg-transparent"
          } p-[2px] rounded-md transition-all duration-300`}
        >
          <input
            id={passwordId}
            type="password"
            autoComplete="new-password"
            required
            placeholder="••••••••"
            maxLength={MAX_PASSWORD_LENGTH}
            className="w-full px-4 py-2 bg-gray-800 rounded-md focus:outline-none text-text"
            value={password}
            onChange={handlePasswordChange}
            aria-describedby={
              passwordError
                ? passwordErrorId
                : password
                ? passwordStrengthId
                : undefined
            }
            aria-invalid={passwordError ? "true" : "false"}
          />
        </div>

        {/* Password strength indicator */}
        {password && (
          <div className="mt-2" aria-hidden="true">
            <div className="flex justify-between items-center mb-1">
              <div className="text-xs text-text">Siła hasła:</div>
              <div
                className="text-xs"
                id={passwordStrengthId}
                aria-live="polite"
              >
                {getStrengthLabel()}
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${getStrengthColor()}`}
                style={{ width: `${passwordStrength}%` }}
              ></div>
            </div>
          </div>
        )}

        {passwordError && (
          <p id={passwordErrorId} className="text-red-400 text-xs mt-1">
            {passwordError}
          </p>
        )}
      </div>{" "}
      {/* Confirm Password field */}
      <div className="space-y-2">
        <label
          htmlFor={passwordConfirmId}
          className="block text-sm font-medium"
        >
          Potwierdź hasło
        </label>
        <div
          className={`group ${
            password !== passwordConfirm && passwordConfirm
              ? "bg-red-500"
              : "focus-within:bg-gradient-to-r focus-within:from-primary focus-within:via-secondary focus-within:to-accent bg-transparent"
          } p-[2px] rounded-md transition-all duration-300`}
        >
          <input
            id={passwordConfirmId}
            type="password"
            autoComplete="new-password"
            required
            placeholder="••••••••"
            maxLength={MAX_PASSWORD_LENGTH}
            className="w-full px-4 py-2 bg-gray-800 rounded-md focus:outline-none text-text"
            value={passwordConfirm}
            onChange={handlePasswordConfirmChange}
            aria-invalid={
              password !== passwordConfirm && passwordConfirm ? "true" : "false"
            }
          />
        </div>
        {password !== passwordConfirm && passwordConfirm && (
          <p className="text-red-400 text-xs mt-1">Hasła nie są identyczne</p>
        )}
        <div className="px-3 bg-transparent rounded-md">
          <p className="text-xs text-text opacity-80">
            Twoje hasło powinno zawierać:
          </p>
          <ul className="text-xs list-disc list-inside space-y-1 mt-2 text-text opacity-80">
            <li>Przynajmniej 8 znaków</li>
            <li>Przynajmniej jedną dużą literę</li>
            <li>Przynajmniej jedną małą literę</li>
            <li>Przynajmniej jedną cyfrę</li>
            <li>Przynajmniej jeden znak specjalny</li>
          </ul>
        </div>
      </div>
      {/* Submit button */}{" "}
      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 rounded-md font-medium transition-all bg-secondary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 text-white shadow-md cursor-pointer disabled:cursor-none"
        >
          {isLoading ? "Rejestracja..." : "Zarejestruj się"}
        </button>
      </div>
    </form>
  );
};
