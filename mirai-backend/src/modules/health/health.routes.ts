import { Router } from 'express';
import * as controller from './health.controller';

const router = Router();

router.get('/', controller.health);

export default router;
