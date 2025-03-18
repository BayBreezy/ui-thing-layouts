/**
 * Composable that provides the user data
 */
export const useUser = () => {
  const user = ref({
    name: "Jeremy Carter",
    firstName: "Jeremy",
    lastName: "Carter",
    image: "https://randomuser.me/api/portraits/med/men/5.jpg",
    email: "jeremey.carter@yahoo.com",
  });
  const initials = computed(() => {
    if (!user.value) return "";
    return `${user.value.firstName.charAt(0)}${user.value.lastName.charAt(0)}`;
  });
  return { user, initials };
};
