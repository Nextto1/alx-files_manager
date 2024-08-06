import dbClient from './utils/db';

const waitConnection = () => new Promise((resolve, reject) => {
  let k = 0;
  const repeatFct = async () => {
    await setTimeout(() => {
      k += 1;
      if (k >= 10) {
        reject();
      } else if (!dbClient.isAlive()) {
        repeatFct();
      } else {
        resolve();
      }
    }, 1000);
  };
  repeatFct();
});

(async () => {
  console.log(dbClient.isAlive());
  await waitConnection();
  console.log(dbClient.isAlive());
  console.log(await dbClient.nbUsers());
  console.log(await dbClient.nbFiles());
})();
