import { getDirectConnection } from "./src/config/database.js";

async function test() {
  const connection = await getDirectConnection();
  try {
    const res = await connection.execute(
        `UPDATE RECRUITMENT_CANDIDATES SET CV_FILE_NAME = NVL(:cvname, CV_FILE_NAME) WHERE CANDIDATE_ID = 35`,
        { cvname: "test_update_file.pdf" },
        { autoCommit: true }
    );
    console.log("UPDATE result:", res);
  } catch(e) {
    console.error(e);
  } finally {
    await connection.close();
  }
}
test();
