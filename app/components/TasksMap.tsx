"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

type Task = {
  id: number;
  type: string;
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  note?: string;
  scheduled_at?: string;
  completed_at?: string;
  images?: string[];
  created_at?: string;
  latitude?: number | null;
  longitude?: number | null;
};

type NotFoundTask = {
  id: number;
  name?: string;
  address?: string;
};

type Coordinates = {
  lat: number;
  lng: number;
};

declare global {
  interface Window {
    google: any;
  }
}

function escapeHtml(value?: string) {
  if (!value) {
    return "-";
  }

  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(
      resolve,
      milliseconds
    );
  });
}

function formatDate(dateString?: string) {
  if (!dateString) {
    return "-";
  }

  try {
    const normalizedValue =
      dateString
        .replace("T", " ")
        .slice(0, 19);

    const [datePart, timePart] =
      normalizedValue.split(" ");

    if (!datePart) {
      return dateString;
    }

    const [year, month, day] =
      datePart
        .split("-")
        .map(Number);

    const [hour, minute] =
      (timePart || "00:00")
        .split(":")
        .map(Number);

    const date = new Date(
      year,
      month - 1,
      day,
      hour || 0,
      minute || 0
    );

    if (
      Number.isNaN(date.getTime())
    ) {
      return dateString;
    }

    return new Intl.DateTimeFormat(
      "hu-HU",
      {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(date);
  } catch {
    return dateString;
  }
}

function normalizeAddress(
  address: string
) {
  return address
    .trim()
    .toLocaleLowerCase("hu-HU")
    .replace(/\s+/g, " ");
}

function createSearchVariants(
  address: string
) {
  const cleanAddress = address
    .trim()
    .replace(/\s+/g, " ");

  if (!cleanAddress) {
    return [];
  }

  const firstSpaceIndex =
    cleanAddress.indexOf(" ");

  if (firstSpaceIndex === -1) {
    return [
      cleanAddress,
      cleanAddress + ", Magyarország",
    ];
  }

  const city = cleanAddress.slice(
    0,
    firstSpaceIndex
  );

  const street = cleanAddress.slice(
    firstSpaceIndex + 1
  );

  return Array.from(
    new Set([
      cleanAddress,
      cleanAddress + ", Magyarország",
      street + ", " + city,
      street +
        ", " +
        city +
        ", Magyarország",
      city + ", Magyarország",
    ])
  );
}

function getSavedCoordinates(
  task: Task
): Coordinates | null {
  const latitude =
    task.latitude === null ||
    task.latitude === undefined
      ? Number.NaN
      : Number(task.latitude);

  const longitude =
    task.longitude === null ||
    task.longitude === undefined
      ? Number.NaN
      : Number(task.longitude);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude === 0 ||
    longitude === 0
  ) {
    return null;
  }

  return {
    lat: latitude,
    lng: longitude,
  };
}

async function findCoordinates(
  address: string
): Promise<Coordinates | null> {
  const normalizedAddress =
    normalizeAddress(address);

  if (!normalizedAddress) {
    return null;
  }

  const cacheKey =
    "tasks-map-coordinate-" +
    normalizedAddress;

  const cachedValue =
    window.localStorage.getItem(
      cacheKey
    );

  if (cachedValue) {
    try {
      const cachedCoordinates =
        JSON.parse(
          cachedValue
        ) as Coordinates;

      if (
        Number.isFinite(
          cachedCoordinates.lat
        ) &&
        Number.isFinite(
          cachedCoordinates.lng
        ) &&
        cachedCoordinates.lat !== 0 &&
        cachedCoordinates.lng !== 0
      ) {
        return cachedCoordinates;
      }
    } catch {
      window.localStorage.removeItem(
        cacheKey
      );
    }
  }

  const searchVariants =
    createSearchVariants(address);

  for (
    let index = 0;
    index < searchVariants.length;
    index += 1
  ) {
    const searchAddress =
      searchVariants[index];

    const baseUrl =
      "https:" +
      "//nominatim.openstreetmap.org/search";

    const searchUrl =
      baseUrl +
      "?format=jsonv2" +
      "&limit=1" +
      "&countrycodes=hu" +
      "&addressdetails=1" +
      "&q=" +
      encodeURIComponent(searchAddress);

    try {
      const response = await fetch(
        searchUrl,
        {
          method: "GET",
          headers: {
