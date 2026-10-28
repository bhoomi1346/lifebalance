const PATHS = {
  home: ["M3 11l9-8 9 8", "M5 10v10h14V10"],
  dashboard: ["M4 4h7v7H4z", "M13 4h7v7h-7z", "M4 13h7v7H4z", "M13 13h7v7h-7z"],
  daily: ["M4 20h4L19 9l-4-4L4 16z", "M14 6l4 4"],
  calendar: ["M4 6h16v14H4z", "M4 10h16", "M8 3v4", "M16 3v4"],
  simulator: ["M4 7h16", "M4 17h16", "M9 5v4", "M15 15v4"],
  reports: ["M7 3h7l5 5v13H7z", "M14 3v5h5", "M9 13h7", "M9 17h7"],
  devices: ["M8 3h8v4H8z", "M8 17h8v4H8z", "M6 7h12v10H6z"],
  profile: ["M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M4 21c1-4 4-6 8-6s7 2 8 6"],
  account: ["M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"],
  admin: ["M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z", "M12 3v3", "M12 18v3", "M3 12h3", "M18 12h3", "M5.6 5.6l2.1 2.1", "M16.3 16.3l2.1 2.1", "M5.6 18.4l2.1-2.1", "M16.3 7.7l2.1-2.1"],
  chat: ["M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5A8.5 8.5 0 1 1 21 12z"],
  logout: ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "M16 17l5-5-5-5", "M21 12H9"],
};

export default function Icon({ name, size = 20 }) {
  return (
    <svg className="ico" width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {(PATHS[name] || []).map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}