export function getRelativeDays(timestamp: string | Date | number): string {
  const date = new Date(timestamp);
  const now = new Date();

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  const diffTime = today.getTime() - targetDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "today";
  } else if (diffDays === 1) {
    return "1 day ago";
  } else if (diffDays > 0 && diffDays < 60) {
    return `${diffDays} days ago`;
  }

  if (diffDays >= 60) {
    const months = Math.floor(diffDays / 30);

    if (months < 24) {
      return months === 1 ? "1 month ago" : `${months} months ago`;
    }

    const years = Math.floor(months / 12);
    return years === 1 ? "1 year ago" : `${years} years ago`;
  }

    return "";
}
