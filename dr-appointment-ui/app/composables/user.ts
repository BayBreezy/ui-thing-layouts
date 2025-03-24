export const useUser = () =>
  useState("current-user", () => ({
    firstName: "Lilly",
    lastName: "Singh",
    email: "lilly.singh@example.com",
    avatar: "https://randomuser.me/api/portraits/women/17.jpg",
    role: "admin",
    initials: "LS",
  }));
