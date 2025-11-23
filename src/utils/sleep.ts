/*
Sleep utility
Pauses the execution of the code for a specified amount of time
*/ 

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

