"use server";

export const upsertChallengeProgress = async (challengeId: number) => {
  throw new Error(
    `Challenge progress is not supported in the current course model. Challenge id: ${challengeId}`,
  );
};
