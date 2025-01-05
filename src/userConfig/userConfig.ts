export const userConfigDef = [
  {
    key: "webshareUsername",
    type: "text" as const,
    title: "WebshareCz username",
  },
  {
    key: "websharePassword",
    type: "password" as const,
    title: "WebshareCz password",
  },
  {
    key: "prehrajtoUsername",
    type: "text" as const,
    title: "PrehrajTo username",
  },
  {
    key: "prehrajtoPassword",
    type: "password" as const,
    title: "PrehrajTo password",
  },
];

export type UserConfigData = Partial<{
  webshareUsername: string;
  websharePassword: string;
  prehrajtoUsername: string;
  prehrajtoPassword: string;
  sledujtetoUsername: string;
  sledujtetoPassword: string;
}>;
