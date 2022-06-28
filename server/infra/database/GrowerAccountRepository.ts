import FilterOptions from 'interfaces/FilterOptions';
import GrowerAccount from 'interfaces/GrowerAccount';
import HttpError from 'utils/HttpError';
import BaseRepository from './BaseRepository';
import Session from './Session';

export default class GrowerAccountRepository extends BaseRepository<GrowerAccount> {
  constructor(session: Session) {
    super('planter', session);
  }

  async getById(id: string | number) {
    const object = await this.session
      .getDB()
      .select(
        this.session.getDB().raw(`
        planter.*,
        country.name as country_name,
        continent.name as continent_name
        from planter
        left join trees on planter.id = trees.planter_id
        left join region as country on ST_WITHIN(trees.estimated_geometric_location, country.geom)
          and country.type_id in
            (select id from region_type where type = 'country')
        left join region as continent on ST_WITHIN(trees.estimated_geometric_location, continent.geom)
          and continent.type_id in
            (select id from region_type where type = 'continents' )
      `),
      )
      .where('planter.id', id)
      .first();

    if (!object) {
      throw new HttpError(404, `Can not find ${this.tableName} by id:${id}`);
    }
    return object;
  }

  async getByOrganization(organization_id: number, options: FilterOptions) {
    const { limit, offset } = options;
    const sql = `
      SELECT
        *
      FROM planter
      WHERE planter.organization_id = ${organization_id}
      LIMIT ${limit}
      OFFSET ${offset}
    `;
    const object = await this.session.getDB().raw(sql);
    return object.rows;
  }

  async getByName(keyword: string, options: FilterOptions) {
    const { limit, offset } = options;
    const sql = `
      SELECT
        *
      FROM planter
      WHERE first_name LIKE '${keyword}%' OR last_name LIKE '${keyword}%'
      ORDER BY first_name, last_name
      LIMIT ${limit}
      OFFSET ${offset}
    `;
    const object = await this.session.getDB().raw(sql);
    return object.rows;
  }

  async getFeaturedGrowerAccounts(options: FilterOptions) {
    const { limit } = options;
    const sql = `
      SELECT
      *
      FROM planter
      ORDER BY id DESC
      LIMIT ${limit}
    `;
    const object = await this.session.getDB().raw(sql);
    return object.rows;
  }
}
